#!/usr/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
URL=http://localhost:5000/

sleep 0.2 && echo "OPENING FRONT-END UI: xdg-open $URL" && xdg-open $URL &
bash -c "echo \"RUNNING SERVER: $SCRIPT_DIR/server.js\" && cd -- $SCRIPT_DIR && node server.js"
