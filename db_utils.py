from flaskext.mysql import MySQL
from db import mysql

# SQL returns rows of tuples 
# e.g. result =   [
#                     (var_1, var_2, var_3,... var_N),
#                     (var_1, var_2, var_3,... var_N),
#                     ...
#                     (var_1, var_2, var_3,... var_N),
#                 ]

class DBHelper:
    '''
        This is similar to the methods below this class, but is a tad bit more useful
    '''
    def __init__(self, mysql: MySQL):
        self.mysql = mysql

    def execute(self, query, vals=None, fetch="all"):
        '''
            Execute SQL queries.

            Args:
                +query (`str`): SQL statement
                +vals (`tuple` or `list` or `dict` or `None`): query parameters
                +fetch (`str` or `None`): 
                    "all" -> fetchall() -> returns a list of tuples
                    "one" -> fetchone() -> returns the result as a single tuple (if >1)
                    None -> no fetch (expected INSERT/UPDATE/DELETE)

            Returns:
                post -> list[dict] or dict as [{"rowcount": int, "lastrowid": int}]
                get -> list[tuples] or tuple as [(ret_val1, ret_val2,...),...]
                
        '''
        conn = self.mysql.connect()
        cursor = conn.cursor()

        try:
            cursor.execute(query, vals or ())

            if fetch == "all":
                result = cursor.fetchall()

            # NOTE: Unpack the result using as if it was an array
            elif fetch == "one":
                result = cursor.fetchone()
            else:
                result = {"rowcount": cursor.rowcount, "lastrowid": cursor.lastrowid}

            conn.commit()
            return result

        finally:
            cursor.close()
            conn.close()

    def get(self, query, vals=None, fetchOne=False):
        '''
            For SELECT Queries
        '''
        return self.execute(query, vals, fetch="one" if fetchOne else "all")
        

    def post(self, query, vals=None):
        '''
            For INSERT/UPDATE/DELETE queries. 
            Returns {rowcount=,  lastrowid=,} as a dict, 
                where rowcount is # of rowsaffected, and 
                lastrowid is the PK for the most recently returned row
        '''
        return self.execute(query, vals, fetch=None)



def get_one_from_db(query, vals=None):
    conn = mysql.connect()
    cursor = conn.cursor()
    cursor.execute(query, vals) if vals else cursor.execute(query)
    # result = cursor.fetchone()
    result = []
    for row in cursor:
        result.append(list(row))
    conn.commit()
    conn.close()
    return result


def getFromDB(query, vals=None, providedConn=None, providedCursor=None):
    if providedConn is None:
        conn = mysql.connect()
    elif providedConn:
        conn = providedConn
    if providedCursor is None:
        cursor = conn.cursor()
    elif providedCursor:
        cursor = providedCursor

    cursor.execute(query, vals) if vals else cursor.execute(query)
    # result = cursor.fetchall()
    result = []
    for row in cursor:
        result.append(list(row))
    if providedConn is None:
        conn.commit()
        conn.close()
    return result


def postToDB(query, vals=None, providedConn=None, providedCursor=None):
    if providedConn is None:
        conn = mysql.connect()
    elif providedConn:
        conn = providedConn
    if providedCursor is None:
        cursor = conn.cursor()
    elif providedCursor:
        cursor = providedCursor

    cursor.execute(query, vals) if vals else cursor.execute(query)
    if providedConn is None:
        conn.commit()
        conn.close()


def deleteFromDB(query, vals=None, providedConn=None, providedCursor=None):
    if providedConn is None:
        conn = mysql.connect()
    elif providedConn:
        conn = providedConn
    if providedCursor is None:
        cursor = conn.cursor()
    elif providedCursor:
        cursor = providedCursor

    cursor.execute(query, vals) if vals else cursor.execute(query)
    if providedConn is None:
        conn.commit()
        conn.close()


