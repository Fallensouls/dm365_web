image_version=`date +%Y%m%d%H%M`;
echo $image_version;

# git pull --rebase origin master;
docker stop vueapp;
docker rm vueapp;
docker build -t vueapp:$image_version .;
docker images;
docker run -p 3000:80 -d --name vueapp vueapp:$image_version;
# -v ~/docker-data/house-web/appsettings.json:/app/appsettings.json -v ~/docker-data/house-web/NLogFile/:/app/NLogFile   --restart=always
docker logs vueapp;
#删除build过程中产生的镜像    #docker image prune -a -f
docker rmi $(docker images -f "dangling=true" -q)