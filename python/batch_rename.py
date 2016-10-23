#!/usr/bin/python

'''
A Copy of script at https://github.com/geekcomputers/Python/blob/master/batch_file_rename.py
'''


import os
import sys


def batch_rename( work_dir, old_ext, new_ext ):
    for filename in os.listdir( work_dir ):
        cur_ext = os.path.splitext( filename )[ 1 ]
        if cur_ext == old_ext:
            newfile = filename.replace( old_ext, new_ext )
            os.rename(
                os.path.join( work_dir, filename ),
                os.path.join( work_dir, newfile )
            )

def main():
    work_dir = sys.argv[ 1 ]
    old_ext  = sys.argv[ 2 ]
    new_ext  = sys.argv[ 3 ]
    batch_rename( work_dir, old_ext, new_ext )

if __name__ == '__main__':
    main()
