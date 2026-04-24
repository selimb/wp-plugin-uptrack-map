# Deployment Procedure

```
VERSION=1.x
./scripts/bumpversion.ts $VERSION
git commit -am "v$VERSION"
git tag "v$VERSION"
git push
git push --tags
```
