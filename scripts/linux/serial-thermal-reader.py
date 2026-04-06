#!/usr/bin/env python3
"""
Reads MLX90614 thermal sensor JSON from RP2040 over serial and:
  1. Writes to a JSON file for laptop-exporter to pick up
  2. Publishes to MQTT for the backend mqtt-thermal collector

Environment variables (all optional, have defaults):
  SERIAL_PORT   - serial device (default: /dev/ttyACM0)
  SERIAL_BAUD   - baud rate (default: 115200)
  OUTPUT_FILE   - path to write JSON (default: ./runtime/laptop-thermal.json)
  MQTT_HOST     - MQTT broker host (default: 192.168.6.38)
  MQTT_PORT     - MQTT broker port (default: 1883)
  MQTT_TOPIC    - MQTT topic to publish to (default: sensors/laptop_thermal/mlx90614)
  MQTT_USERNAME - MQTT username (optional)
  MQTT_PASSWORD - MQTT password (optional)
"""

import json
import logging
import os
import time

import paho.mqtt.client as mqtt
import serial

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    datefmt='%Y-%m-%dT%H:%M:%S',
)
log = logging.getLogger(__name__)

SERIAL_PORT = os.environ.get('SERIAL_PORT', '/dev/ttyACM0')
SERIAL_BAUD = int(os.environ.get('SERIAL_BAUD', '115200'))
OUTPUT_FILE = os.environ.get(
    'OUTPUT_FILE',
    os.path.join(os.path.dirname(__file__), '../../runtime/laptop-thermal.json'),
)
OUTPUT_FILE = os.path.realpath(OUTPUT_FILE)
MQTT_HOST = os.environ.get('MQTT_HOST', '192.168.6.38')
MQTT_PORT = int(os.environ.get('MQTT_PORT', '1883'))
MQTT_TOPIC = os.environ.get('MQTT_TOPIC', 'sensors/laptop_thermal/mlx90614')
MQTT_USERNAME = os.environ.get('MQTT_USERNAME', '')
MQTT_PASSWORD = os.environ.get('MQTT_PASSWORD', '')


def write_json_file(data: dict) -> None:
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    tmp = OUTPUT_FILE + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(data, f)
    os.replace(tmp, OUTPUT_FILE)


def make_mqtt_client() -> mqtt.Client:
    client = mqtt.Client()
    if MQTT_USERNAME:
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

    def on_connect(c, userdata, flags, rc):
        if rc == 0:
            log.info(f"MQTT connected to {MQTT_HOST}:{MQTT_PORT}")
        else:
            log.warning(f"MQTT connect failed, rc={rc}")

    def on_disconnect(c, userdata, rc):
        if rc != 0:
            log.warning(f"MQTT disconnected unexpectedly, rc={rc}")

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.reconnect_delay_set(min_delay=2, max_delay=30)
    try:
        client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
    except Exception as e:
        log.warning(f"MQTT initial connect failed: {e} — will retry automatically")
    client.loop_start()
    return client


def main() -> None:
    log.info(f"Serial port:  {SERIAL_PORT} @ {SERIAL_BAUD}")
    log.info(f"Output file:  {OUTPUT_FILE}")
    log.info(f"MQTT broker:  {MQTT_HOST}:{MQTT_PORT}  topic={MQTT_TOPIC}")

    mqtt_client = make_mqtt_client()

    while True:
        try:
            with serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=5) as ser:
                log.info(f"Opened {SERIAL_PORT}")
                while True:
                    raw = ser.readline()
                    if not raw:
                        continue
                    line = raw.decode('utf-8', errors='replace').strip()
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        log.debug(f"Non-JSON line: {line!r}")
                        continue

                    write_json_file(data)
                    mqtt_client.publish(MQTT_TOPIC, json.dumps(data), qos=0)
                    log.debug(f"Published: {data}")

        except serial.SerialException as e:
            log.error(f"Serial error: {e} — retrying in 5s")
            time.sleep(5)
        except Exception as e:
            log.exception(f"Unexpected error: {e} — retrying in 5s")
            time.sleep(5)


if __name__ == '__main__':
    main()
