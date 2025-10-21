import psycopg2
import os
import datetime
from werkzeug.exceptions import HTTPException, Unauthorized, InternalServerError


def connect():
    try:
        conn = psycopg2.connect(dbname=os.getenv("DB_NAME"), user=os.getenv("DB_USER"), password=os.getenv("DB_PASSWORD"), host=os.getenv("DB_HOST"))
        
        print("Connection successful")

        migrate(conn)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None
    
def migrate(conn):
    cur = conn.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS users (id VARCHAR PRIMARY KEY, reqs_left INTEGER, last_req TIMESTAMP);")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS connections (
    id VARCHAR PRIMARY KEY,
    opened_at TIMESTAMP,
    user_id VARCHAR UNIQUE NOT NULL,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);""")
    conn.commit()

def fetch_user(conn, uid):
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id=%s;", (uid,))
        user = cur.fetchone()
        if (user):
            return uid, user[1]
        else:
            return uid, create_user(conn, uid)
    except Exception as e:
        raise InternalServerError(e)

def create_user(conn, uid):
    try:
        reqs_left = int(os.getenv("REQUESTS_PER_DAY"))
        cur = conn.cursor()
        cur.execute("INSERT INTO users (id, reqs_left, last_req) VALUES (%s, %s, %s);", (uid, reqs_left, datetime.datetime.now(),))
        conn.commit()
        return reqs_left
    except Exception as e:
        raise InternalServerError(e)


def create_connection(conn, sid, user_id):
    try:
        cur = conn.cursor()
        cur.execute("SELECT * from connections WHERE user_id=%s", (user_id, ))
        res = cur.fetchone()
        if (res):
            delete_connection(conn, res[0])

        cur.execute("INSERT INTO connections (id, opened_at, user_id) VALUES (%s, %s, %s);", (sid, datetime.datetime.now(), user_id))
        conn.commit()
            
        
    except Exception as e:
        raise InternalServerError(e)
    
def delete_connection(conn, sid):
    try:
        cur = conn.cursor()
        cur.execute("SELECT * from connections WHERE id=%s", (sid, ))
        res = cur.fetchone()
        if (res):
            cur.execute("DELETE FROM connections WHERE id=%s;", (sid, ))
            conn.commit()
        else:
            return
        
    except Exception as e:
        raise InternalServerError(e)


