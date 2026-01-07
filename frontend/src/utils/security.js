import CryptoJS from 'crypto-js';
import { ethers } from 'ethers';

// 1. Tạo Key từ Chữ ký ví (Deterministic Key Generation)
// Cùng 1 ví + cùng 1 message => Luôn ra cùng 1 Key
export const generateKeyFromWallet = async (provider) => {
    try {
        const signer = await provider.getSigner();
        // Yêu cầu user ký một thông điệp cố định để lấy chữ ký
        const message = "Sign this message to unlock your encrypted NFT data. Do not share this signature!";
        const signature = await signer.signMessage(message);
        
        // Dùng chữ ký (dài loằng ngoằng) băm ra để làm Key AES 256-bit
        return CryptoJS.SHA256(signature).toString();
    } catch (error) {
        throw new Error("User denied signature");
    }
};

// 2. Mã hóa File (File Object -> Encrypted File Object)
export const encryptFile = (file, key) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const wordArray = CryptoJS.lib.WordArray.create(reader.result);
            // Mã hóa AES
            const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
            
            // Tạo thành file mới (dạng text/blob) để upload
            const encryptedBlob = new Blob([encrypted], { type: 'text/plain' });
            const encryptedFile = new File([encryptedBlob], file.name + ".enc", { type: "text/plain" });
            
            resolve(encryptedFile);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

// 3. Giải mã (Encrypted String/Url -> Original Data URL)
export const decryptContent = async (encryptedUrl, key) => {
    // Tải nội dung file mã hóa từ IPFS/Cloud về
    const response = await fetch(encryptedUrl);
    const encryptedText = await response.text();

    // Giải mã AES
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
    
    // Chuyển lại thành định dạng hiển thị ảnh (Base64)
    // Lưu ý: Đây là xử lý cho ảnh, nếu là PDF cần convert sang Uint8Array
    const str = decrypted.toString(CryptoJS.enc.Base64);
    return `data:image/png;base64,${str}`; // Giả sử ảnh PNG/JPG
};