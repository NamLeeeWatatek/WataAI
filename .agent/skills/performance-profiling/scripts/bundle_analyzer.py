#!/usr/bin/env python3
"""
Skill: performance-profiling
Script: bundle_analyzer.py
Purpose: Run Next.js bundle analysis
Note: Requires @next/bundle-analyzer
"""
import subprocess
import os
import sys
import json

def run_analysis(project_path: str):
    print(f"Running bundle analysis in {project_path}...")
    
    # Run analysis
    env = os.environ.copy()
    env["ANALYZE"] = "true"
    
    result = subprocess.run(
        ["npm", "run", "analyze"],
        cwd=project_path,
        env=env,
        capture_output=True,
        text=True,
        shell=True
    )
    
    if result.returncode == 0:
        print("Bundle analysis completed successfully.")
        # Check if .next/analyze folder exists
        analyze_path = os.path.join(project_path, ".next", "analyze")
        if os.path.exists(analyze_path):
            print(f"Reports generated at: {analyze_path}")
        return True
    else:
        print(f"Bundle analysis failed: {result.stderr}")
        return False

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "."
    success = run_analysis(path)
    sys.exit(0 if success else 1)
