#!/bin/bash  
  
step=1 #間隔的秒數，不能大於60  
  
for (( i = 1; i > 0; i=(i+step) )); do  
    ./Cytus.js shedule
    sleep $step
done  
  
exit 0 