import React from 'react';

interface IMaintenancePageProps {
}

const MaintenancePage = ({}: IMaintenancePageProps) => {
    return (
        <main className="main leaderboards" style={{ color: 'white' }}>
            <div className="container" style={{ marginTop: 150 }}>
                <h1>Maintenance</h1>
            </div>
        </main>
    )
};

export default MaintenancePage;
