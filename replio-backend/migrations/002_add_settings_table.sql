-- Migration: Add settings table
-- Created: 2026-08-29
-- Purpose: Store application configuration settings per company

CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_company_key (company_id, key),
    INDEX idx_company_id (company_id),
    INDEX idx_key (key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
