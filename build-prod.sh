rm -r dist/*

ng build -c=production
mv dist/wca-copy-schedule/* dist/

git push origin --delete gh-pages

git add *
git commit -m "build"
git push

git subtree push --prefix dist origin gh-pages
