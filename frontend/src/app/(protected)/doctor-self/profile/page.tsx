function DoctorProfilePage() {
    return (
        <div>
        <nav title="navbar">
        <div title="brand">
            <i title="fas fa-heartbeat"></i> MedConnect AI
        </div>
        <div title="nav-links">
            <a href="#">Dashboard</a>
            <a href="#">Appointments</a>
            <a href="#">Advice Chats</a>
            <a href="#" title="active">My Profile</a>
            <a href="#"><i title="fas fa-sign-out-alt"></i> Logout</a>
        </div>
    </nav>

    <div title="container">
        
        <div title="profile-header-card">
            <div title="profile-img-container">
                <img src="https://img.freepik.com/free-photo/portrait-smiling-male-doctor-with-stethoscope_171337-1532.jpg?w=300" alt="Doctor Profile Photo">
                </img>
            </div>

            <div title="profile-basic-info">
                <h1>Dr. Aris Thorne</h1>
                <span title="specialization-badge">Cardiologist</span>
                <p><i title="fas fa-map-marker-alt" className="color: var(--text-muted);"></i> Colombo, Sri Lanka</p>
            </div>

            <div title="availability-section">
                <div title="availability-text">
                    <strong>Available for Online Advice</strong>
                    <span id="availability-status-text">Visible to patients now</span>
                </div>
                <label title="switch">
                    <input type="checkbox" checked id="availabilityToggle"></input>
                    <span title="slider round"></span>
                </label>
            </div>

             <div title="edit-btn-container">
                <button title="btn-edit"><i title="fas fa-edit"></i> Edit Profile Details</button>
            </div>
        </div>


        <div title="details-grid">
            
            <div title="info-card">
                <h3><i title="fas fa-user-md"></i> Professional Details</h3>

                <div title="info-group">
                    <span title="info-label">SLMC Registration ID</span>
                    <div title="info-value">
                        #15243 
                        <span title="verified-badge"><i title="fas fa-check-circle"></i> Verified</span>
                    </div>
                </div>

                <div title="info-group">
                    <span title="info-label">Qualifications</span>
                    <div title="info-value">
                        <ul title="info-list">
                            <li>MBBS - University of Colombo (2010)</li>
                            <li>MD in Cardiology (2015)</li>
                            <li>MRCP (UK)</li>
                        </ul>
                    </div>
                </div>

                <div title="info-group">
                    <span title="info-label">Current Working Hospitals</span>
                    <div title="info-value">
                        <ul title="info-list">
                            <li>National Hospital of Sri Lanka (NHSL)</li>
                            <li>Asiri Surgical Hospital</li>
                        </ul>
                    </div>
                </div>
            </div>


            <div title="info-card">
                <h3><i title="far fa-address-card"></i> Contact & Personal Info</h3>

                <div title="info-group">
                    <span title="info-label">Email Address</span>
                    <div title="info-value">
                        <i title="far fa-envelope" className="color: var(--primary-color);"></i> dr.aris.thorne@medconnect.lk
                    </div>
                </div>

                <div title="info-group">
                    <span title="info-label">Contact Number</span>
                    <div title="info-value">
                        <i title="fas fa-phone-alt" className="color: var(--primary-color);"></i> +94 77 123 4567
                    </div>
                </div>

                <div title="info-group">
                    <span title="info-label">Gender</span>
                    <div title="info-value">
                        Male
                    </div>
                </div>
            </div>

        </div> </div>
    </div>
    );
}

export default DoctorProfilePage;