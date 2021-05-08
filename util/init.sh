#!/bin/bash

pushd server;
yarn;
popd;

chmod +x ksnp;
chmod +x ksrv;
chmod +x snp;
chmod +x srv;

./ksnp;
./ksrv;
./snp;
./srv;