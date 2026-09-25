import os
import subprocess
import time
from datetime import datetime

# Define absolute paths based on this script's location
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, 'backend')
FRONTEND_DIR = os.path.join(ROOT_DIR, 'frontend')
TESTS_DIR = os.path.join(ROOT_DIR, 'tests')

# Ensure tests directory exists
os.makedirs(TESTS_DIR, exist_ok=True)

BACKEND_REPORT = os.path.join(TESTS_DIR, 'backend_results.md')
FRONTEND_REPORT = os.path.join(TESTS_DIR, 'frontend_results.md')

def run_command(command, cwd, report_file, module_name):
    print(f"\n{'='*50}")
    print(f"🚀 STARTING {module_name} TESTS")
    print(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*50}\n")
    
    start_time = time.time()
    
    try:
        # Run process and capture output
        process = subprocess.Popen(
            command,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            shell=True
        )
        
        output = ""
        for line in process.stdout:
            print(line, end="")
            output += line
            
        process.wait()
        duration = time.time() - start_time
        status = "✅ PASSED" if process.returncode == 0 else "❌ FAILED"
        
        # Write to report file
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(f"# {module_name} Test Results\n\n")
            f.write(f"**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"**Status:** {status}\n")
            f.write(f"**Duration:** {duration:.2f} seconds\n\n")
            f.write("## Console Output\n\n```text\n")
            f.write(output)
            f.write("\n```\n")
            
        print(f"\n{'='*50}")
        print(f"{status} - {module_name} TESTS")
        print(f"⏱️ Duration: {duration:.2f} seconds")
        print(f"📄 Report saved to: {report_file}")
        print(f"{'='*50}\n")
        
        return process.returncode == 0
        
    except Exception as e:
        print(f"❌ ERROR running {module_name} tests: {e}")
        return False

def main():
    print("\n🌟 NEXCLINIC UNIFIED TEST RUNNER 🌟\n")
    
    # 1. Run Backend Tests
    # Using the standard manage.py test command for apps that have tests
    backend_cmd = "python manage.py test users doctor patient hospital chat"
    backend_success = run_command(backend_cmd, BACKEND_DIR, BACKEND_REPORT, "BACKEND (Django)")
    
    # 2. Run Frontend Tests
    # Using Playwright
    frontend_cmd = "npx playwright test"
    frontend_success = run_command(frontend_cmd, FRONTEND_DIR, FRONTEND_REPORT, "FRONTEND (Playwright)")
    
    # 3. Final Summary
    print("\n" + "#"*50)
    print("🏆 FINAL TEST SUMMARY 🏆")
    print("#"*50)
    print(f"Backend Tests:   {'✅ PASSED' if backend_success else '❌ FAILED'}")
    print(f"Frontend Tests:  {'✅ PASSED' if frontend_success else '❌ FAILED'}")
    print(f"\nReports generated in: {TESTS_DIR}")
    print("#"*50 + "\n")

if __name__ == "__main__":
    main()
