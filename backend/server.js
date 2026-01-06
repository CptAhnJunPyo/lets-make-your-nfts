require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const pinataSDK = require('@pinata/sdk');
const multer = require('multer');
const crypto = require('node:crypto');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractABI = [
    "function mintCertificate(address to, string memory uri, string memory dataHashBytes) public",
    "function hashToTokenId(bytes32 hash) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function mintExtended(address to, string memory uri, string memory dataHashBytes, uint8 _type, address _coOwner, uint256 _value) public",
    "function redeemVoucher(uint256 tokenId) public",
];
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new ethers.Contract(contractAddress, contractABI, wallet);
const readContract = new ethers.Contract(contractAddress, contractABI, provider);

//CẤU HÌNH PINATA
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);

app.post('/api/mint', upload.single('certificateFile'), async (req, res) => {
    try {
        const { 
            userAddress, 
            type, 
            studentName, 
            certName, 
            description,
            issuerName,
            coOwner, 
            voucherValue 
        } = req.body;

        const file = req.file;
        if (!file) return res.status(400).json({ error: "Thiếu file" });

        console.log(`Đang xử lý Mint loại: [${type.toUpperCase()}]`);

        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
        const solidityHash = ethers.keccak256(ethers.toUtf8Bytes(fileHash));
        
        const existingTokenIdBigInt = await readContract.hashToTokenId(solidityHash);
        if (existingTokenIdBigInt.toString() !== "0") {
             return res.status(400).json({ success: false, error: "File này đã tồn tại trên hệ thống!" });
        }

        const stream = require('stream');
        const fileStream = stream.Readable.from(file.buffer);
        fileStream.path = file.originalname; 

        const fileRes = await pinata.pinFileToIPFS(fileStream, { 
            pinataMetadata: { 
            name: `IMG-${Date.now()}_${file.originalname}` 
            }
        });
        if (!fileRes || !fileRes.IpfsHash) {
            throw new Error("Không lấy được IpfsHash từ Pinata");
        }
        
        const imageURI = `ipfs://${fileRes.IpfsHash}`;
        console.log("Upload ảnh thành công:", imageURI);
        
        let metadataName = "";
        let attributes = [];
        
        if (type === 'voucher') {
            metadataName = `${certName} - $${voucherValue}`; 
            attributes = [
                { trait_type: "Type", value: "Voucher" },
                { trait_type: "Issuer", value: issuerName },
                { trait_type: "Value", value: parseInt(voucherValue), display_type: "number" },
                { trait_type: "Currency", value: "USD" },
                { trait_type: "Redeemable", value: "Yes" }
            ];

        } else if (type === 'joint') {
            metadataName = `${certName} (Joint Contract)`;
            attributes = [
                { trait_type: "Type", value: "Joint Ownership" },
                { trait_type: "Primary Owner", value: userAddress }, 
                { trait_type: "Co-Owner", value: coOwner || "Pending" }, 
                { trait_type: "Signed Date", value: new Date().toISOString().split('T')[0], display_type: "date" }
            ];

        } else {
            metadataName = `${certName} - ${studentName}`;
            attributes = [
                { trait_type: "Type", value: "Certificate" },
                { trait_type: "Student Name", value: studentName },
                { trait_type: "Program", value: "Blockchain Dev" }, 
                { trait_type: "Issuer", value: issuerName },
                { trait_type: "Issued Date", value: new Date().toISOString().split('T')[0], display_type: "date" }
            ];
        }

        const metadata = {
            name: metadataName,
            description: description || `Verifiable item issued by ${issuerName}`,
            image: imageURI,
            external_url: "https://your-project.vercel.app",
            attributes: attributes,
            certificate_hash: `0x${fileHash}`,
            file_cid: fileRes.IpfsHash,
            created_type: type
        };

        const jsonRes = await pinata.pinJSONToIPFS(metadata, { pinataMetadata: { name: `META-${Date.now()}` } });
        const tokenURI = `ipfs://${jsonRes.IpfsHash}`;

        let typeInt = 0; 
        if (type === 'joint') typeInt = 1;
        if (type === 'voucher') typeInt = 2;

        console.log(`Minting on-chain: Type ${typeInt}, CoOwner: ${coOwner}, Value: ${voucherValue}`);

        const tx = await contract.mintExtended(
            userAddress,
            tokenURI,
            fileHash,
            typeInt, 
            coOwner || ethers.ZeroAddress,
            voucherValue || 0              
        );
        
        await tx.wait();
        console.log("Mint thành công:", tx.hash);

        res.json({ success: true, txHash: tx.hash, tokenURI, metadata });

    } catch (error) {
        console.error("Lỗi Mint:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/verify', upload.single('verifyFile'), async (req, res) => {
    try {
        const file = req.file;
        const { claimerAddress } = req.body;
        
        if (!file) return res.status(400).json({ message: "Thiếu file verify" });

        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
        const solidityHash = ethers.keccak256(ethers.toUtf8Bytes(fileHash));

        const tokenIdBigInt = await readContract.hashToTokenId(solidityHash);
        const tokenId = tokenIdBigInt.toString();

        if (tokenId === "0") {
            return res.json({ verified: false, message: "Tài liệu này KHÔNG tồn tại trên Blockchain." });
        }

        const currentOwner = await readContract.ownerOf(tokenId);
        const details = await readContract.tokenDetails(tokenId);
        const typeCode = Number(details[0]); 
        
        const typeLabel = ["Standard Certificate", "Joint Contract", "Voucher"][typeCode];

        const extraData = {
            type: typeLabel,
            typeCode: typeCode,
            coOwner: details[1],
            value: details[2].toString(),
            isRedeemed: details[3]
        };

        const tokenURI = await readContract.tokenURI(tokenId);
        const httpURI = tokenURI.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/");
        
        let metaData = {};
        try {
            const metaRes = await axios.get(httpURI);
            metaData = metaRes.data;
        } catch (e) { console.log("Lỗi fetch IPFS:", e.message); }

        const isOwner = claimerAddress && (currentOwner.toLowerCase() === claimerAddress.toLowerCase());

        res.json({
            verified: true,
            tokenId,
            currentOwner,
            isYourCert: isOwner,
            details: extraData,
            metadata: metaData
        });

    } catch (error) {
        console.error("Lỗi Verify:", error);
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server Backend chạy tại localhost:${PORT}`);
});