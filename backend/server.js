require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const pinataSDK = require('@pinata/sdk');
const multer = require('multer');
const crypto = require('node:crypto'); // Import chuẩn để tránh lỗi

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình Multer lưu file vào RAM
const upload = multer({ storage: multer.memoryStorage() });

// Cấu hình Blockchain
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// ABI và Contract
const contractABI = [
    "function mintCertificate(address to, string memory uri, string memory dataHashBytes) public",
    "function hashToTokenId(bytes32 hash) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)"
];
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new ethers.Contract(contractAddress, contractABI, wallet);
const readContract = new ethers.Contract(contractAddress, contractABI, provider);

// Cấu hình Pinata
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);

// --- API MINT (Đã sửa lỗi tokenURI) ---
app.post('/api/mint', upload.single('certificateFile'), async (req, res) => {
    try {
        const { 
            userAddress, studentName, certName, description, 
            issuerName, programName, issuedAt, expiryDate, externalUrl 
        } = req.body;

        const file = req.file;
        if (!file) return res.status(400).json({ success: false, error: "Thiếu file ảnh/PDF" });

        console.log(`🔄 Đang xử lý Mint cho: ${studentName}`);

        // --- BƯỚC 0: TÍNH HASH & KIỂM TRA TRƯỚC (PRE-CHECK) ---
        // Tính hash của file gốc ngay lập tức
        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
        
        // Chuyển sang format Hash của Solidity (Keccak256 của chuỗi hex string)
        // Vì trong contract: hash = keccak256(abi.encodePacked(dataHashString))
        const solidityHash = ethers.keccak256(ethers.toUtf8Bytes(fileHash));

        console.log("Pre-check Hash:", fileHash);
        
        // Hỏi Contract xem hash này đã có TokenID chưa
        const existingTokenIdBigInt = await readContract.hashToTokenId(solidityHash);
        const existingTokenId = existingTokenIdBigInt.toString();

        // NẾU ĐÃ TỒN TẠI -> DỪNG NGAY LẬP TỨC
        if (existingTokenId !== "0") {
            console.warn(`⚠️ TỪ CHỐI: File này đã được mint cho Token ID #${existingTokenId}`);
            return res.status(400).json({ 
                success: false, 
                error: `Dữ liệu này đã được cấp Certificate (Token ID #${existingTokenId}). Không thể mint lại.` 
            });
        }

        console.log("Pre-check OK: Dữ liệu chưa tồn tại. Tiến hành upload IPFS...");

        // --- BƯỚC 1: UPLOAD ẢNH LÊN PINATA ---
        const fileStream = require('stream').Readable.from(file.buffer);
        const fileOptions = { pinataMetadata: { name: `IMG-${studentName}-${Date.now()}` } };
        
        const fileRes = await pinata.pinFileToIPFS(fileStream, fileOptions);
        const imageURI = `ipfs://${fileRes.IpfsHash}`;
        const fileCID = fileRes.IpfsHash;
        console.log("Ảnh đã upload:", imageURI);

        // --- BƯỚC 2: TẠO METADATA JSON ---
        const formattedHash = `0x${fileHash}`; // Hash lưu vào Contract (string)
        
        const metadata = {
            name: `${certName} - ${studentName}`,
            description: description || `Certified by ${issuerName}`,
            image: imageURI,
            external_url: externalUrl || "",
            attributes: [
                { trait_type: "Student Name", value: studentName },
                { trait_type: "Issuer", value: issuerName },
                { trait_type: "Program", value: programName },
                { trait_type: "Issued Date", value: issuedAt },
                { trait_type: "Expiry Date", value: expiryDate || "Permanent" }
            ],
            certificate_hash: formattedHash,
            file_cid: fileCID,
            issuer_address: wallet.address
        };

        // --- BƯỚC 3: UPLOAD METADATA JSON ---
        const jsonOptions = { pinataMetadata: { name: `META-${studentName}-${Date.now()}` } };
        const jsonRes = await pinata.pinJSONToIPFS(metadata, jsonOptions);
        const tokenURI = `ipfs://${jsonRes.IpfsHash}`;
        console.log("Metadata URI:", tokenURI);

        // --- BƯỚC 4: MINT NFT ---
        console.log("⏳ Đang gửi giao dịch...");
        
        // Truyền fileHash (string) vào contract
        const tx = await contract.mintCertificate(userAddress, tokenURI, fileHash);
        await tx.wait();

        console.log("Mint thành công!");

        res.json({
            success: true,
            txHash: tx.hash,
            tokenURI: tokenURI,
            metadata: metadata
        });

    } catch (error) {
        console.error("Lỗi Mint:", error);
        // Xử lý lỗi revert từ contract (phòng hờ trường hợp race condition)
        if (error.code === 'CALL_EXCEPTION' || error.message.includes("Du lieu nay da duoc cap")) {
             return res.status(400).json({ success: false, error: "Dữ liệu này đã được cấp Certificate rồi!" });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});
// --- API VERIFY ---
app.post('/api/verify', upload.single('verifyFile'), async (req, res) => {
    try {
        const file = req.file;
        const { claimerAddress } = req.body;

        if (!file) return res.status(400).json({ message: "Thiếu file verify" });

        // 1. Tính lại Hash file (Logic giống hệt lúc Mint)
        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
        
        // 2. Chuyển sang format Hash của Solidity
        const solidityHash = ethers.keccak256(ethers.toUtf8Bytes(fileHash));

        // 3. Hỏi Contract
        const tokenIdBigInt = await readContract.hashToTokenId(solidityHash);
        const tokenId = tokenIdBigInt.toString();

        if (tokenId === "0") {
            return res.json({ verified: false, message: "Không tìm thấy tài liệu này trên chuỗi." });
        }

        const currentOwner = await readContract.ownerOf(tokenId);
        const isOwner = claimerAddress && (currentOwner.toLowerCase() === claimerAddress.toLowerCase());

        res.json({
            verified: true,
            tokenId,
            currentOwner,
            isYourCert: isOwner
        });

    } catch (error) {
        console.error("❌ Lỗi Verify:", error);
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server Backend chạy tại http://localhost:${PORT}`);
});