import './VerifySection.css';

function VerifySection({ verifyFile, setVerifyFile, handleVerifyRequest, status, verifyResult }) {
  return (
    <section className="create-section">
      <div className="section-header">
        <h1 className="page-title">Verify Document</h1>
      </div>
      <div className="create-container">
        <div className="upload-area">
          <div className="upload-zone">
            <input 
              type="file" 
              id="verify" 
              className="file-input-hidden" 
              onChange={(e) => setVerifyFile(e.target.files[0])}
            />
            <label htmlFor="verify" className="upload-label">
              {verifyFile ? verifyFile.name : "Upload Original File"}
            </label>
          </div>
        </div>
        <div className="form-panel">
          <button 
            className="create-btn" 
            onClick={handleVerifyRequest} 
            disabled={!verifyFile}
          >
            Verify Integrity
          </button>
          {status && <div className="status-alert">{status}</div>}
          
          {verifyResult && (
            <div className={`verify-result ${verifyResult.verified ? 'valid' : 'invalid'}`}>
              <h3>{verifyResult.verified ? "VALID DOCUMENT" : "INVALID DOCUMENT"}</h3>
              {verifyResult.verified && (
                <div className="verify-details" style={{textAlign:'left'}}>
                  <p><strong>Name:</strong> {verifyResult.metadata?.name}</p>
                  <p><strong>Type:</strong> {verifyResult.details?.type}</p>
                  
                  {verifyResult.details?.typeCode === 1 && (
                    <p style={{color:'blue'}}>
                      <strong>Co-Owner:</strong> {verifyResult.details.coOwner}
                    </p>
                  )}
                  {verifyResult.details?.typeCode === 2 && (
                    <p style={{color:'orange'}}>
                      <strong>Value:</strong> ${verifyResult.details.value} ({verifyResult.details.isRedeemed ? 'USED' : 'ACTIVE'})
                    </p>
                  )}
                  
                  <hr/>
                  <p className="ownership-tag">
                    {verifyResult.isYourCert ? "You own this!" : "You do NOT own this."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default VerifySection;
