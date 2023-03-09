#!/bin/bash


. ~/csgo_util.sh


while true
do
    clutch_case_num=$(csgo_list outter 4471 2)
    echo clutch_case_num=${clutch_case_num}
    if [[ ${clutch_case_num} < 850 ]];then
        need_num=$((850 - ${clutch_case_num}))
        echo need_num=${need_num}
        csgo_moveout 4471 ${need_num} 1
    fi
    sleep 10s
done

function keep_case_num() {
    
}