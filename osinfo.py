#!/usr/bin/python

# This script is base on Craig Richards' script  https://github.com/geekcomputers/Python/blob/master/osinfo.py
# And made a little modification

import platform as pl

profile = [
	'architecture',
	'linux_distribution',
	'mac_ver',
	'machine',
	'node',
	'platform',
	'processor',
	'python_build',
	'python_compiler',
	'python_version',
	'release',
	'system',
	'uname',
	'version',
	]

for key in profile:
	if hasattr( pl, key ):
		print ' '*(20-len(key) ) + key + ' : ' + str( getattr( pl, key )() )
