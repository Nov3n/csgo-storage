#!/bin/bash

function kill_process() {
    if [ $# -lt 1 ];then
        echo "Param Error, Usage: kill_process process_name"
        return
    fi
    pid=$(ps aux | grep $1 | grep -v grep | awk '{print $2}')
    echo "pid=${pid}"
    kill -9 ${pid}
}

op="start"
if [ $# -eq 1 ];then
    op=$1
fi
js_file="2500-move.js"
if [ ${op} == "restart" ];then
    kill_process "${js_file}"
    nohup node ${js_file} >/dev/null 2>&1 &
elif [ ${op} == "start" ];then
    nohup node ${js_file} >/dev/null 2>&1 &
elif [ ${op} == "stop" ];then
    kill_process '${js_file}'
fi


