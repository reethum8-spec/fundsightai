@echo off
cd /d "C:\Users\Reethu M\OneDrive\Desktop\FundSightAI"
git init
git branch -M main 2>nul
git add .
git commit -m "Initial FundSight AI commit" 2>nul
git remote remove origin 2>nul
git remote add origin https://github.com/reethum8-spec/fundsightai.git
git pull origin main --allow-unrelated-histories 2>nul || echo pull skipped
git push -u origin main --force
echo ---DONE---
