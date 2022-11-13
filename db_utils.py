from flaskext.mysql import MySQL
from db import mysql

def get_one_from_db(query, vals=None):
	conn = mysql.connect()
	cursor = conn.cursor()
	cursor.execute(query, vals) if vals else cursor.execute(query)
	#result = cursor.fetchone()
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
	#result = cursor.fetchall()
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