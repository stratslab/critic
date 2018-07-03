# -*- mode: python; encoding: utf-8 -*-
#
# Copyright 2014 the Critic contributors, Opera Software ASA
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License.  You may obtain a copy of
# the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
# License for the specific language governing permissions and limitations under
# the License.

import sys
import psycopg2
import argparse
import os


def do_migrate(db):
    cursor = db.cursor()

    try:
        # Check if the 'origin' column already exists.
        cursor.execute("SELECT obsoleted_by FROM reviews")
    except psycopg2.ProgrammingError:
        # Seems it doesn't.
        db.rollback()
    else:
        return
    # Add the reviews.obsoleted_by and reviews.obsoletes column.
    cursor.execute(
        """ALTER TABLE reviews
             ADD obsoleted_by INTEGER,
             ADD obsoletes INTEGER""")

    db.commit()
    db.close()


def runtime_migrate():
    import dbaccess
    do_migrate(dbaccess.connect())


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--runtime", action="store_true")
    parser.add_argument("--uid", type=int)
    parser.add_argument("--gid", type=int)

    arguments = parser.parse_args()

    if arguments.runtime:
        runtime_migrate()
    else:
        os.setgid(arguments.gid)
        os.setuid(arguments.uid)

        db = psycopg2.connect(database="critic")
        do_migrate(db)
