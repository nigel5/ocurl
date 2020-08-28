CQL="DROP KEYSPACE ocurl;
CREATE KEYSPACE ocurl WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1'} AND durable_writes = true;
CREATE TABLE IF NOT EXISTS ocurl.url_mapping (from_key varchar, to_url varchar, created_on date, original_creator_ip varchar, PRIMARY KEY (from_key));
CREATE INDEX IF NOT EXISTS ON ocurl.url_mapping (to_url);
USE ocurl;"

until echo $CQL | cqlsh; do
  echo "cqlsh: Cassandra is unavailable to initialize - will retry later"
  sleep 2
done &

exec /docker-entrypoint.sh "$@"
