// src/utils/security.js
import CryptoJS from 'crypto-js';

// 1. Tạo Key giải mã/mã hóa từ Chữ ký ví
// Cùng 1 ví ký vào message này sẽ luôn ra cùng 1 Key
export const generateKeyFromWallet = async (signer) => {
    try {
        const message = "Sign this message to encrypt/decrypt your NFT data. Keep it safe!";
        const signature = await signer.signMessage(message);
        // Băm chữ ký ra để lấy chuỗi Key 256-bit chuẩn
        return CryptoJS.SHA256(signature).toString();
    } catch (error) {
        throw new Error("User denied signature");
    }
};

export const encryptFile = (file, key) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const wordArray = CryptoJS.lib.WordArray.create(reader.result);
            // Mã hóa AES
            const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();            
            // Đóng gói lại thành File object để gửi qua FormData
            const encryptedBlob = new Blob([encrypted], { type: 'text/plain' });
            // Thêm đuôi .enc để nhận diện
            const encryptedFile = new File([encryptedBlob], file.name + ".enc", { type: "text/plain" });
            
            resolve(encryptedFile);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

export const decryptContent = async (ipfsUrl, key) => {
    // 1. Tải nội dung mã hóa từ IPFS về
    const httpUrl = ipfsUrl.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/");
    const response = await fetch(httpUrl);
    const encryptedText = await response.text();

    // 2. Giải mã AES
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
    
    // 3. Chuyển sang Base64 để hiển thị thẻ <img>
    const str = decrypted.toString(CryptoJS.enc.Base64);
    
    return `data:image/png;base64,${str}`; 
};
export const verifyIntegrity = async (decryptedDataUrl, originalHash) => {
    return new Promise((resolve, reject) => {
        try {
            // 1. Chuyển Base64/DataURL về dạng ArrayBuffer để tính Hash
            // (Vì lúc Mint ta tính Hash trên file gốc binary)
            const fetchBlob = async () => {
                const res = await fetch(decryptedDataUrl);
                const blob = await res.blob();
                
                const reader = new FileReader();
                reader.onload = () => {
                    const wordArray = CryptoJS.lib.WordArray.create(reader.result);
                    const calculatedHash = CryptoJS.SHA256(wordArray).toString();
                    
                    console.log("Calculated Hash:", calculatedHash);
                    console.log("Original Hash:  ", originalHash);

                    // 2. So sánh (Không phân biệt hoa thường)
                    const isValid = calculatedHash.toLowerCase() === originalHash.toLowerCase();
                    resolve(isValid);
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(blob);
            };
            
            fetchBlob();
        } catch (error) {
            reject(error);
        }
    });
};