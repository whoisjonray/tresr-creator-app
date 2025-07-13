import React, { useEffect, useState } from 'react';
import designService from '../services/designService';

export const DataMigration = ({ children }) => {
  const [migrating, setMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    checkAndMigrate();
  }, []);

  const checkAndMigrate = async () => {
    // Check if migration is needed
    if (!designService.needsMigration()) {
      setMigrationComplete(true);
      return;
    }

    // Check if we've already attempted migration
    const migrationAttempted = localStorage.getItem('dbMigrationAttempted');
    if (migrationAttempted === 'true') {
      setMigrationComplete(true);
      return;
    }

    try {
      setMigrating(true);
      console.log('📦 Starting data migration from localStorage to database...');
      
      const result = await designService.migrateFromLocalStorage();
      
      console.log(`✅ Migration complete:`, result);
      
      // Mark migration as attempted
      localStorage.setItem('dbMigrationAttempted', 'true');
      
      setMigrationComplete(true);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      // Still mark as complete to not block the app
      setMigrationComplete(true);
    } finally {
      setMigrating(false);
    }
  };

  if (migrating) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#374151' }}>
            Upgrading Your Data Storage
          </h2>
          <p style={{ marginBottom: '30px', color: '#6b7280' }}>
            We're migrating your designs to our improved database system.
            This will only take a moment...
          </p>
          <div style={{
            width: '200px',
            height: '4px',
            background: '#e5e7eb',
            borderRadius: '2px',
            overflow: 'hidden',
            margin: '0 auto'
          }}>
            <div style={{
              width: '50%',
              height: '100%',
              background: '#00c896',
              animation: 'slide 1s ease-in-out infinite'
            }} />
          </div>
        </div>
        <style jsx>{`
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  if (!migrationComplete) {
    return null;
  }

  return children;
};