npm run startdb
npm run startMQ
docker build -f="Dockerfile" -t="devtooldocker7585/cetusapiserver:v1" .
docker run --rm -it  -p 3001:3001/tcp devtooldocker7585/cetusapiserver:v1