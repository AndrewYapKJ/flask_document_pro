#!/usr/bin/env python3
"""
ODBC Driver Detection and Setup Helper
Run this to check your ODBC configuration on macOS
"""

import sys
import platform
import logging

logger = logging.getLogger(__name__)

def setup_logging():
    logging.basicConfig(level=logging.INFO, format='%(message)s')

setup_logging()

def check_odbc_drivers():
    """Check available ODBC drivers"""
    logger.info("%s", "=" * 60)
    logger.info("ODBC Driver Detection")
    logger.info("%s", "=" * 60)
    logger.info("Platform: %s %s", platform.system(), platform.release())
    logger.info("Python: %s", sys.version)
    logger.info("")
    
    try:
        import pyodbc
        logger.info("✅ pyodbc is installed")
        logger.info("   Version: %s", pyodbc.version)
        logger.info("")
        
        drivers = pyodbc.drivers()
        logger.info("Available ODBC Drivers (%d):", len(drivers))
        logger.info("%s", "-" * 60)
        
        sql_server_drivers = []
        for driver in sorted(drivers):
            is_sql_server = 'SQL Server' in driver
            marker = "🎯" if is_sql_server else "  "
            logger.info("%s %s", marker, driver)
            if is_sql_server:
                sql_server_drivers.append(driver)
        
        logger.info("")
        logger.info("%s", "=" * 60)
        
        if not sql_server_drivers:
            logger.error("No SQL Server ODBC drivers found!")
            logger.info("")
            logger.info("To install ODBC Driver 18 on macOS:")
            logger.info("1. Update Xcode Command Line Tools:")
            logger.info("   sudo rm -rf /Library/Developer/CommandLineTools")
            logger.info("   sudo xcode-select --install")
            logger.info("")
            logger.info("2. Install via Homebrew:")
            logger.info("   brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release")
            logger.info("   HOMEBREW_NO_ENV_FILTERING=1 ACCEPT_EULA=Y brew install msodbcsql18 mssql-tools18")
            logger.info("")
            logger.info("Or install Driver 17 (older but compatible):")
            logger.info("   brew install msodbcsql17")
        else:
            logger.info("✅ SQL Server ODBC Drivers Found:")
            for driver in sql_server_drivers:
                version = "18" if "18" in driver else "17" if "17" in driver else "Unknown"
                logger.info("   • %s (Version %s)", driver, version)
            
            # Show recommended driver
            if 'ODBC Driver 18 for SQL Server' in sql_server_drivers:
                logger.info("")
                logger.info("RECOMMENDED: Driver 18 is installed")
            elif 'ODBC Driver 17 for SQL Server' in sql_server_drivers:
                logger.warning("WARNING: Only Driver 17 found (consider upgrading to 18)")
            
        logger.info("%s", "=" * 60)
        
    except ImportError:
        logger.error("pyodbc is NOT installed")
        logger.info("")
        logger.info("Install it with: pip install pyodbc")
        sys.exit(1)
    
    except Exception as e:
        logger.exception("Error checking drivers: %s", e)
        sys.exit(1)


def test_connection():
    """Test database connection with available driver"""
    logger.info("")
    logger.info("%s", "=" * 60)
    logger.info("Connection Test (Optional)")
    logger.info("%s", "=" * 60)
    
    response = input("Test database connection? (y/n): ").strip().lower()
    if response != 'y':
        logger.info("Skipping connection test")
        return
    
    import pyodbc
    
    # Get available SQL Server drivers
    sql_server_drivers = [d for d in pyodbc.drivers() if 'SQL Server' in d]
    
    if not sql_server_drivers:
        logger.error("No SQL Server drivers available for testing")
        return
    
    # Prefer Driver 18
    driver = 'ODBC Driver 18 for SQL Server' if 'ODBC Driver 18 for SQL Server' in sql_server_drivers else sql_server_drivers[0]
    
    logger.info("Using driver: %s", driver)
    
    # Get connection details
    server = input("Server (default: localhost): ").strip() or "localhost"
    database = input("Database (default: DocumentPro): ").strip() or "DocumentPro"
    username = input("Username (default: sa): ").strip() or "sa"
    
    import getpass
    password = getpass.getpass("Password: ")
    
    try:
        conn_str = (
            f"DRIVER={{{driver}}};"
            f"SERVER={server};"
            f"DATABASE={database};"
            f"UID={username};"
            f"PWD={password};"
            f"TrustServerCertificate=yes"
        )
        
        logger.info("")
        logger.info("Connecting...")
        conn = pyodbc.connect(conn_str, timeout=10)
        cursor = conn.cursor()
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        
        logger.info("Connection successful!")
        logger.info("")
        logger.info("SQL Server Version:")
        logger.info(version)
        
        conn.close()
        
    except Exception as e:
        logger.exception("Connection failed: %s", e)
        logger.info("")
        logger.info("Common issues:")
        logger.info("1. SQL Server not running")
        logger.info("2. Incorrect credentials")
        logger.info("3. Server not accessible")
        logger.info("4. Firewall blocking connection")


if __name__ == "__main__":
    check_odbc_drivers()
    test_connection()
    
    logger.info("")
    logger.info("%s", "=" * 60)
    logger.info("Setup Complete!")
    logger.info("%s", "=" * 60)
