#!/bin/bash
while :
do
	( cmdpid=$BASHPID; (sleep 4h; kill $cmdpid) & exec /usr/bin/node /home/ubuntu/testnetfaucet/www.js )
done
