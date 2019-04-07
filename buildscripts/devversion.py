#!/usr/bin/env python
from __future__ import print_function
import sys
attrs={}
with open(sys.argv[1],"r") as fileh:
	for line in fileh:
		line=line.strip()
		parts=line.split("=",2)
		attrs[parts[0]]=parts[1]
if "type" in attrs:
	print ("{0}-{1}".format(attrs["version"],attrs["type"]))
else:
	print (attrs["version"])