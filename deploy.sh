(
cp -r public build
cd build
git init
git config user.name "Derek Reynolds"
git config user.email "derekr@me.com"
git add .
git commit -m "Deployed to Github Pages"
git push --force --quiet "https://${GH_TOKEN}@${GH_REF}" master:gh-pages > /dev/null 2>&1
)
