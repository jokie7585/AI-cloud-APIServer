#!/bin/bash  
  
step=1 #間隔的秒數，不能大於60  
  
while :
do  
    ./Cytus.js shedule
    sleep $step
done  
  
exit 0 