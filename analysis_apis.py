from flask import Flask, request, jsonify
from flask_restful import Api, Resource
from flask_cors import CORS

import os
import io
import datetime
import json
from os import path
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.cluster import KMeans
from sklearn.metrics import mean_absolute_error, mean_squared_error

import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
import plotly.io as pio
from plotly.subplots import make_subplots

import folium
from shapely.geometry import LineString, Point
from folium.plugins import MarkerCluster, HeatMap
from folium import Marker, Icon, Circle, CircleMarker, GeoJson, PolyLine, Map
from geopy.distance import geodesic

import gtfs_kit as gk

app = Flask(__name__)
CORS(app)

path = Path('data/gtfs-nyc-2023.zip')
feed = gk.read_feed(path, dist_units='km')
# print(feed.validate())

def clean_feed_data(feed):
  # Removing the space from the Arrival and Departure Time
  feed.stop_times['arrival_time'] = feed.stop_times['arrival_time'].str.replace(' ', '')
  feed.stop_times['departure_time'] = feed.stop_times['departure_time'].str.replace(' ', '')

  routes_with_no_trips = []
  for idx, row in feed.routes.iterrows():
    if len(feed.trips[feed.trips['route_id'] == row['route_id']]) == 0:
      routes_with_no_trips.append(row['route_id'])
  # Removing all the routes with no trips i.e. routes_with_no_trips
  feed.routes = feed.routes[~feed.routes['route_id'].isin(routes_with_no_trips)]

  return feed

feed = clean_feed_data(feed=feed)
# print(feed.validate())

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Welcome to the GTFS API of New York City!"})

@app.route('/routes', methods=['GET'])
def get_routes():
    """
    API to get the list of routes from the GTFS feed.
    """
    routes_df = feed.routes.fillna('NA')  # Replace NaN with a placeholder like 'NA'
    routes_json = routes_df.to_dict(orient='records')
    
    # print("Routes JSON (after replacing NaN):", routes_json)  # Log modified response
    return jsonify(routes_json), 200
@app.route('/route/<route_id>', methods=['GET'])
def get_route_by_id(route_id):
    """
    API to get the details of a specific route by its ID.
    """
    route = feed.routes[feed.routes['route_id'] == route_id]
    if not route.empty:
        route_json = route.to_dict(orient='records')
        return jsonify(route_json), 200
    else:
        return jsonify({'error': 'Route not found'}), 404

@app.route('/stops', methods=['GET'])
def get_stops():
    """
    API to get the list of all stops from the GTFS feed.
    """
    stops_df = feed.stops
    stops_json = stops_df.to_dict(orient='records')
    return jsonify(stops_json), 200

@app.route('/stop/<stop_id>', methods=['GET'])
def get_stop_by_id(stop_id):
    """
    API to get the details of a specific stop by its ID.
    """
    stop = feed.stops[feed.stops['stop_id'] == stop_id]
    if not stop.empty:
        stop_json = stop.to_dict(orient='records')
        return jsonify(stop_json), 200
    else:
        return jsonify({'error': 'Stop not found'}), 404

@app.route('/trips', methods=['GET'])
def get_trips():
    """
    API to get the list of all trips from the GTFS feed.
    """
    trips_df = feed.trips
    trips_json = trips_df.to_dict(orient='records')
    return jsonify(trips_json), 200

@app.route('/trip/<trip_id>', methods=['GET'])
def get_trip_by_id(trip_id):
    """
    API to get the details of a specific trip by its ID.
    """
    trip = feed.trips[feed.trips['trip_id'] == trip_id]
    if not trip.empty:
        trip_json = trip.to_dict(orient='records')
        return jsonify(trip_json), 200
    else:
        return jsonify({'error': 'Trip not found'}), 404

@app.route('/stop_times/trip/<trip_id>', methods=['GET'])
def get_stop_times_by_trip(trip_id):
    """
    API to get the stop times for a specific trip ID.
    """
    stop_times = feed.stop_times[feed.stop_times['trip_id'] == trip_id]
    if not stop_times.empty:
        stop_times_json = stop_times.to_dict(orient='records')
        return jsonify(stop_times_json), 200
    else:
        return jsonify({'error': 'No stop times found for this trip'}), 404

@app.route('/routes/search/<route_name>', methods=['GET'])
def search_routes_by_name(route_name):
    """
    API to search for routes by their short name or long name.
    """
    routes = feed.routes[(feed.routes['route_short_name'].str.contains(route_name, case=False, na=False) | 
                          feed.routes['route_long_name'].str.contains(route_name, case=False, na=False))]

    if not routes.empty:
        routes_json = routes.to_dict(orient='records')
        return jsonify(routes_json), 200
    else:
        return jsonify({'error': 'No routes found matching the short name'}), 404

@app.route('/routes_with_trips', methods=['GET'])
def get_routes_with_trips():
    # Get the route_id from the query parameters
    route_id = request.args.get('route_id')
    
    if not route_id:
        return jsonify({"error": "route_id is required"}), 400

    # Filter trips based on the provided route_id
    trips_filtered = feed.trips[feed.trips['route_id'] == route_id]

    if trips_filtered.empty:
        return jsonify({"error": "No trips found for the given route_id"}), 404
    
    return jsonify({
        "route_id": route_id,
        "trips": trips_filtered.to_dict(orient='records')
    }), 200

@app.route('/calendar_dates', methods=['GET'])
def get_calendar_dates():
    """
    API to get the list of calendar dates from the GTFS feed.
    """
    calendar_dates = feed.calendar.to_dict(orient='records')
    return jsonify(calendar_dates), 200

@app.route('/api/route_stats', methods=['GET'])
def get_route_stats():
    # Get the date parameter from the query string
    date = request.args.get('date')
    
    # Validate the date format
    try:
        pd.to_datetime(date, format="%Y%m%d")  # Validate date format
    except ValueError as e:
        return jsonify({'error': f'Invalid date format. Use YYYYMMDD., {e}'}), 400
    
    # date = "".join(date.split("-"))
    
    # Compute trip_stats
    trip_stats = feed.compute_trip_stats()

    # Compute route_stats for the specific date
    route_stats = feed.compute_route_stats(trip_stats, dates=[date])
    route_stats = route_stats.merge(feed.routes[['route_id', 'route_long_name', 'route_color']])

    # Convert route_stats DataFrame to JSON and return it
    route_stats_json = route_stats.to_dict(orient='records')
    return jsonify({'route_stats': route_stats_json})

def classify_time_of_day(start_time):
    """Classify time of day based on the start_time (HH:MM:SS)."""
    hour = int(start_time.split(":")[0])
    
    if 4 <= hour < 8:
        return 'Morning'
    elif 8 <= hour < 12:
        return "Peak Morning"
    elif 12 <= hour < 16:
        return 'Afternoon'
    elif 16 <= hour < 20:
        return 'Peak Evening'
    elif 20 <=  hour < 24:
        return 'Night'
    else:
        return 'Mid Night'

def classify_time_period(start_time):
    """Classify time period based on the start_time (HH:MM:SS)."""
    hour = int(start_time.split(":")[0])

    for i in range(0, 23, 2):
        if i <= hour < i + 2:
            return f'{i}:00-{i+1}:59'
  

@app.route('/api/trip_stats', methods=['GET'])
def get_trip_stats():
    # Get the date parameter from the query string
    date = request.args.get('date')
    
    # Validate the date format
    try:
        pd.to_datetime(date, format="%Y%m%d")  # Validate date format
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYYMMDD.'}), 400
    
    # Compute trip_stats
    trip_stats = feed.compute_trip_stats()

    # Add time of day classification
    trip_stats['time_of_day'] = trip_stats['start_time'].apply(classify_time_of_day)
    trip_stats['time_period'] = trip_stats['start_time'].apply(classify_time_period)

    # Now we can analyze trip duration and speed by time of day
    trip_duration_analysis = trip_stats.groupby('time_of_day').agg({
        'trip_id': ['count'],
        'duration': ['mean', 'min', 'max'],  # Analyze duration (in minutes)
        'speed': ['mean', 'min', 'max']     # Analyze speed (km/h)
    }).reset_index()

    trip_period_analysis = trip_stats.groupby("time_period").agg({
        'trip_id': ['count'],
        'duration': ['mean', 'min', 'max'],  # Analyze duration (in minutes)
        'speed': ['mean', 'min', 'max'] 
    }).reset_index()


    # Convert analysis DataFrame to JSON
    trip_duration_analysis.columns = ['time_of_day', 'num_trips', 'mean_duration', 'min_duration', 'max_duration',
                                      'mean_speed', 'min_speed', 'max_speed']
    trip_duration_analysis_json = trip_duration_analysis.to_dict(orient='records')

    trip_period_analysis.columns = ['period_time', 'num_trips', 'mean_duration', 'min_duration', 'max_duration',
                                      'mean_speed', 'min_speed', 'max_speed']
    trip_period_analysis_json = trip_period_analysis.to_dict(orient='records')
    
    return jsonify({'trip_duration_analysis': trip_duration_analysis_json, 
                    'trip_period_analysis': trip_period_analysis_json})


@app.route('/api/frequent_routes', methods=['GET'])
def get_frequent_routes():
    # Get the date parameter from the query string
    date = request.args.get('date')
    
    # Validate the date format
    try:
        pd.to_datetime(date, format="%Y%m%d")  # Validate date format
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYYMMDD.'}), 400
    
    # Compute trip_stats
    trip_stats = feed.compute_trip_stats()

    route_stats = feed.compute_route_stats(trip_stats, dates=[date])
    route_stats = route_stats.merge(feed.routes[['route_id', 'route_long_name', 'route_color']])

    frequent_routes = route_stats.sort_values(by=['max_headway', 'min_headway']).reset_index(drop=True)
    most_frequent_routes =  frequent_routes.head(10)
    least_frequent_routes =  frequent_routes.iloc[-10::-1]

    most_frequent_routes_json =  most_frequent_routes.to_dict(orient='records')
    least_frequent_routes_json =  least_frequent_routes.to_dict(orient='records')
    return jsonify({'most_frequent_routes': most_frequent_routes_json, 
                    'least_frequent_routes': least_frequent_routes_json}), 200

@app.route('/api/shortest_longest_routes', methods=['GET'])
def get_shortest_longest_routes():
    # Get the date parameter from the query string
    date = request.args.get('date')
    # Validate the date format
    try:
        pd.to_datetime(date, format="%Y%m%d")  # Validate date format
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYYMMDD.'}), 400
    
    # Compute trip_stats
    trip_stats = feed.compute_trip_stats()

    route_stats = feed.compute_route_stats(trip_stats, dates=[date])
    route_stats = route_stats.merge(feed.routes[['route_id', 'route_long_name', 'route_color']])

    shortest_routes = route_stats.sort_values(by='mean_trip_distance').head(10)
    longest_routes = route_stats.sort_values(by='mean_trip_distance', ascending=False).head(10)

    return jsonify({'shortest_routes': shortest_routes.to_dict(orient='records'), 
                    'longest_routes': longest_routes.to_dict(orient='records')})

@app.route('/api/slowest_fastest_routes', methods=['GET'])
def get_slowest_fastest_routes():
    date = request.args.get('date')
    # Validate the date format
    try:
        pd.to_datetime(date, format="%Y%m%d")  # Validate date format
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYYMMDD.'}), 400
    
    # Compute trip_stats
    trip_stats = feed.compute_trip_stats()

    route_stats = feed.compute_route_stats(trip_stats, dates=[date])
    route_stats = route_stats.merge(feed.routes[['route_id', 'route_long_name', 'route_color']])

    slowest_fastest_routes = route_stats.sort_values(by='service_speed')

    return jsonify({'slowest_fastest_routes': slowest_fastest_routes.to_dict(orient='records')}), 200


@app.route('/api/peak_hour_traffic',  methods=['GET'])
def get_peak_hour_traffic():
    date = request.args.get('date')
    # Validate the date format
    try:
        pd.to_datetime(date, format="%Y%m%d")  # Validate date format
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYYMMDD.'}), 400
    
    trip_stats = feed.compute_trip_stats()

    route_stats = feed.compute_route_stats(trip_stats, dates=[date])
    route_stats = route_stats.merge(feed.routes[['route_id', 'route_long_name', 'route_color']])

    trip_stats['time_of_day'] = trip_stats['start_time'].apply(classify_time_of_day)
    trip_stats['time_period'] = trip_stats['start_time'].apply(classify_time_period)

    # routes with most traffic during peak hours
    peak_hour_trips =  trip_stats[trip_stats['time_of_day'].str.contains("peak", case=False)]
    peak_hour_routes = peak_hour_trips.groupby('route_id').agg({
        'trip_id': 'count',
        'time_period': list,
        'time_period_counts': 'nunique'
    }).reset_index()
    peak_hour_routes = peak_hour_routes.merge(route_stats)

    return  jsonify({'peak_hour_routes': peak_hour_routes.to_dict(orient='records')}), 200


@app.route('/api/distance_coverage_optimization', methods=['GET'])
def get_distance_coverage_optimization():
    date = request.args.get('date')
    # Validate the date format
    try:
        pd.to_datetime(date, format="%Y%m%d")  # Validate date format
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYYMMDD.'}), 400
    
    trip_stats = feed.compute_trip_stats()

    route_stats = feed.compute_route_stats(trip_stats, dates=[date])
    route_stats = route_stats.merge(feed.routes[['route_id', 'route_long_name', 'route_color']])

    trip_stats['time_of_day'] = trip_stats['start_time'].apply(classify_time_of_day)
    trip_stats['time_period'] = trip_stats['start_time'].apply(classify_time_period)

    inefficient_routes = route_stats[(route_stats['mean_trip_distance'] > 15) & (route_stats['num_trips'] < 10)]
    inefficient_routes.sort_values(by='mean_trip_distance', ascending=False)

    return  jsonify({'inefficient_routes': inefficient_routes.to_dict(orient='records')}), 200




if  __name__ == '__main__':
  app.run(debug=True)
