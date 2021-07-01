docker build -f="Dockfile" -t="devtooldocker7585/cetusapiserver:v1" .
docker run --rm -it  -p 3001:3001/tcp devtooldocker7585/cetusapiserver:v1