require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const multer = require('multer'); // 1. Import multer

// Cấu hình
const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình Multer để lưu file tạm thời vào bộ nhớ
const upload = multer({ storage: multer.memoryStorage() });

// --- Cấu hình Blockchain và Pinata (giữ nguyên) ---
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contractABI = [
    "function mintCertificate(address to, string memory uri, string memory dataHashBytes) public"
];
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);

// --- API ENDPOINT: MINT NFT ---
// 2. Sử dụng upload.single('file') để nhận 1 file tên là 'file'
app.post('/api/mint', upload.single('certificateFile'), async (req, res) => {
    try {
        // 3. Lấy dữ liệu text từ req.body và file từ req.file
        const { userAddress, name, course } = req.body;
        const file = req.file;

        console.log(` Đang xử lý mint cho: ${userAddress}`);
        console.log("File nhận được:", file.originalname);

        // --- BƯỚC 1: UPLOAD ẢNH/FILE LÊN PINATA ---
        console.log("...Đang upload file lên IPFS...");
        
        // Chuyển buffer file sang stream để Pinata đọc
        const fileStream = require('stream').Readable.from(file.buffer);
        // Đặt tên file trên Pinata (để dễ quản lý)
        const options = {
            pinataMetadata: {
                name: `CertificateImage-${userAddress}-${Date.now()}`,
            },
        };
        
        const fileResult = await pinata.pinFileToIPFS(fileStream, options);
        const imageURI = `ipfs://${fileResult.IpfsHash}`;
        console.log("✅ File uploaded:", imageURI);

        // --- BƯỚC 2: TẠO VÀ UPLOAD JSON METADATA ---
        console.log("...Đang tạo và upload JSON metadata...");
        
        // Tạo metadata chuẩn ERC721
        const metadata = {
            name: `Certificate: ${name}`,
            description: `Chứng chỉ cho khóa học ${course}.`,
            image: imageURI, // Link tới ảnh đã upload ở bước 1
            original_recipient: userAddress, 
            attributes: [
                { trait_type: "Recipient", value: name },
                { trait_type: "Course", value: course },
            ],
        };

        const jsonOptions = {
            pinataMetadata: {
                name: `Metadata-${userAddress}-${Date.now()}`,
            },
        };

        const jsonResult = await pinata.pinJSONToIPFS(metadata, jsonOptions);
        const tokenURI = `ipfs://${jsonResult.IpfsHash}`;
        console.log(" Metadata uploaded:", tokenURI);

        // --- BƯỚC 3: MINT NFT VỚI TOKENURI MỚI ---
        
        // Tạo Hash (giữ nguyên logic cũ)
        const dataHash = ethers.keccak256(ethers.toUtf8Bytes(`${name}-${course}`));

        const tx = await contract.mintCertificate(userAddress, tokenURI, dataHash);
        
        console.log(" Đang chờ giao dịch:", tx.hash);
        await tx.wait(); 

        res.json({
            success: true,
            txHash: tx.hash,
            tokenURI: tokenURI,
            imageURI: imageURI
        });

    } catch (error) {
        console.error(" Lỗi Minting:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
app.post('/api/verify', upload.single('verificationFile'), async (req, res) => {
    try {
        const { userAddress } = req.body; // Ví User đang kết nối
        const file = req.file;

        if (!file || !userAddress) {
            return res.status(400).json({ success: false, message: "Thiếu file hoặc địa chỉ ví." });
        }

        console.log(`VERIFY: Nhận yêu cầu từ ví ${userAddress}`);

        // BƯỚC 1: HASH FILE
        // Tạo lại hash SHA256 (phải giống hệt logic lúc mint)
        // LƯU Ý: Ở đây tôi giả định bạn hash DỮ LIỆU FILE (chứ không phải tên file)
        // Nếu lúc mint bạn hash `${name}-${course}` thì ở đây cũng phải làm vậy.
        // Để đơn giản, giả sử chúng ta hash nội dung file:
        const fileBuffer = file.buffer;
        const dataHashString = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        
        // BƯỚC 2: TÍNH TOÁN KEY CỦA CONTRACT
        // Tính hash Keccak256 của chuỗi hash (giống hệt logic contract)
        const contractHashKey = ethers.keccak256(ethers.toUtf8Bytes(dataHashString));

        // BƯỚC 3: TRUY VẤN CONTRACT (TÌM TOKEN ID)
        // Dùng mapping 'hashToTokenId' mới
        const tokenId = await contract.hashToTokenId(contractHashKey);

        if (tokenId === 0n) { // 0n là BigInt zero
            // Contract trả về 0 nếu không tìm thấy
            console.log("VERIFY: Dữ liệu không tồn tại trên chain.");
            return res.json({ success: false, message: "Tài liệu không hợp lệ (không tìm thấy)." });
        }

        // BƯỚC 4: TRUY VẤN CONTRACT (TÌM CHỦ SỞ HỮU)
        // Lấy chủ sở hữu HIỆN TẠI của NFT này
        const currentOwner = await contract.ownerOf(tokenId);

        // BƯỚC 5: SO SÁNH VÀ TRẢ KẾT QUẢ
        if (currentOwner.toLowerCase() === userAddress.toLowerCase()) {
            console.log(`VERIFY: THÀNH CÔNG! Ví ${userAddress} là chủ sở hữu của Token ID ${tokenId}`);
            res.json({ 
                success: true, 
                message: "Xác thực thành công! Bạn là chủ sở hữu hợp lệ.",
                tokenId: tokenId.toString(),
                owner: currentOwner
            });
        } else {
            console.log(`VERIFY: SAI CHỦ SỞ HỮU. Ví ${userAddress} không phải chủ (chủ là ${currentOwner}).`);
            res.json({ 
                success: false, 
                message: "Tài liệu hợp lệ, nhưng ví của bạn không phải chủ sở hữu.",
                owner: currentOwner
            });
        }

    } catch (error) {
        console.error("Lỗi Verification:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// --- Chạy Server (giữ nguyên) ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(` Server Backend chạy tại http://localhost:${PORT}`);
});