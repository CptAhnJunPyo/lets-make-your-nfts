import './MintSection.css';

function MintSection({ 
  account, 
  nftType, 
  setNftType, 
  selectedFile, 
  setSelectedFile, 
  formData, 
  setFormData, 
  handleMintRequest, 
  status 
}) {
  return (
    <section className="create-section">
      <div className="section-header">
        <h1 className="page-title">Issue New NFT</h1>
        <p className="page-subtitle">Select type: Certificate, Contract, or Voucher</p>
      </div>
      
      <div className="create-container">
        <div className="upload-area">
          <div className="upload-zone">
            <input 
              type="file" 
              id="file-upload" 
              className="file-input-hidden" 
              onChange={(e) => setSelectedFile(e.target.files[0])} 
            />
            <label htmlFor="file-upload" className="upload-label">
              {selectedFile ? (
                <div className="file-preview">
                  <div className="file-name">{selectedFile.name}</div>
                </div>
              ) : (
                <div className="upload-placeholder">Upload File</div>
              )}
            </label>
          </div>
        </div>

        <div className="form-panel">
          <div className="form-content">
            <div className="input-group">
              <label className="input-label">NFT Type</label>
              <select 
                className="input-field" 
                value={nftType} 
                onChange={(e) => setNftType(e.target.value)} 
                style={{height: '45px', fontWeight: 'bold'}}
              >
                <option value="standard">Standard Certificate</option>
                <option value="joint">Joint Contract</option>
                <option value="voucher">VIP Voucher</option>
              </select>
            </div>

            {nftType === 'joint' && (
              <div className="input-group highlight-box" style={{background: '#eff6ff', padding: 15, borderRadius: 8, border: '1px solid #bfdbfe'}}>
                <label className="input-label" style={{color: '#1d4ed8', fontWeight: 'bold'}}>Partner Wallet Address</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="0x..." 
                  value={formData.coOwner} 
                  onChange={(e) => setFormData({...formData, coOwner: e.target.value})} 
                />
                <small style={{color:'#64748b'}}>The person who co-owns this contract.</small>
              </div>
            )}

            {nftType === 'voucher' && (
              <div className="input-group highlight-box" style={{background: '#fffbeb', padding: 15, borderRadius: 8, border: '1px solid #fde68a'}}>
                <label className="input-label" style={{color: '#b45309', fontWeight: 'bold'}}>Voucher Value ($)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="50" 
                  value={formData.voucherValue} 
                  onChange={(e) => setFormData({...formData, voucherValue: e.target.value})} 
                />
              </div>
            )}

            <div className="input-group" style={{marginTop: '15px'}}>
              <label className="input-label">Title / Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder={nftType === 'standard' ? "Bachelor of Science" : (nftType === 'joint' ? "House Rental Agreement" : "Gift Card $50")}
                value={formData.certName} 
                onChange={(e) => setFormData({...formData, certName: e.target.value})} 
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea 
                className="input-field" 
                rows="2" 
                placeholder="Details about this item..." 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
              />
            </div>

            {nftType === 'standard' && (
              <div style={{marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                <h4 style={{margin: '0 0 10px 0', color: '#475569'}}>Certificate Details</h4>
                <div className="input-group">
                  <label className="input-label">Recipient Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Alice Nguyen" 
                    value={formData.studentName} 
                    onChange={(e) => setFormData({...formData, studentName: e.target.value})} 
                  />
                </div>
                
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                  <div className="input-group">
                    <label className="input-label">Issuer</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={formData.issuerName} 
                      onChange={(e) => setFormData({...formData, issuerName: e.target.value})} 
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Program</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={formData.programName} 
                      onChange={(e) => setFormData({...formData, programName: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Issued At</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={formData.issuedAt} 
                    onChange={(e) => setFormData({...formData, issuedAt: e.target.value})} 
                  />
                </div>
              </div>
            )}
            
            <button 
              className="create-btn" 
              onClick={handleMintRequest} 
              disabled={!account || !selectedFile} 
              style={{marginTop: '20px'}}
            >
              Mint {nftType.toUpperCase()}
            </button>
            
            {status && <div className="status-alert">{status}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MintSection;
