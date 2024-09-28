from flask import Flask, request, jsonify
from flask_cors import CORS
import io
import os
import base64
from os import path
from pathlib import Path
import numpy as np
import pandas as pd
import geopandas as gpd
import datetime
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

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error
from sklearn.cluster import KMeans

app = Flask(__name__)
CORS(app)

@app.route('/clean_data', methods=['GET'])
def clean_data():
    try:
        # Load the GTFS data
        path = Path('/content/gtfs-nyc-2023.zip')
        feed = gk.read_feed(path, dist_units='km')

        # Clean the stop_times data
        stop_times = feed.stop_times.copy()
        stop_times['arrival_time'] = stop_times['arrival_time'].str.replace(' ', '')
        stop_times['departure_time'] = stop_times['departure_time'].str.replace(' ', '')
        feed.stop_times = stop_times

        # Remove routes with no trips
        routes_with_no_trips = feed.trips['route_id'].unique()
        feed.routes = feed.routes[~feed.routes['route_id'].isin(routes_with_no_trips)]

        routes = feed.routes.copy()
        shapes = feed.shapes.copy()
        stop_times = feed.stop_times.copy()
        stops = feed.stops.copy()
        trips = feed.trips.copy()

        # Clean the arrival and departure times
        def clean_time(x):
            date = datetime.datetime.today()
            hr, min, sec = x.split(':')
            if x.startswith('24'):
                date = date + datetime.timedelta(days=1)
                hr = '00'
            x = f"{date.strftime('%Y-%m-%d')} {hr}:{min}:{sec}"
            return x

        stop_times['arrival_time'] = stop_times['arrival_time'].apply(clean_time)
        stop_times['departure_time'] = stop_times['departure_time'].apply(clean_time)

        # Convert to datetime
        stop_times['arrival_time'] = pd.to_datetime(stop_times['arrival_time'], format='%Y-%m-%d %H:%M:%S', errors='coerce')
        stop_times['departure_time'] = pd.to_datetime(stop_times['departure_time'], format='%Y-%m-%d %H:%M:%S', errors='coerce')

        # Fill missing shape distances
        stop_times['shape_dist_traveled'] = stop_times['shape_dist_traveled'].fillna(0)

        # Clean routes and stops data
        routes = feed.routes[['route_id', 'route_long_name', 'route_type', 'route_color', 'route_text_color']]
        stops = feed.stops[['stop_id', 'stop_code', 'stop_name', 'stop_lat', 'stop_lon']]

        # Merge trips with routes
        trips = feed.trips.copy()
        trips_routes = trips.merge(routes, on='route_id', how='inner')

        # Merge stop times with trips
        stop_times_trips = stop_times.merge(trips_routes, on='trip_id', how='inner')

        # Group shapes and compute total distance
        shapes = feed.shapes.copy()
        shapes_grouped_lat_long = shapes.groupby('shape_id').apply(lambda x: list(zip(x['shape_pt_lat'], x['shape_pt_lon']))).reset_index().rename(columns={0: 'shape_points'})
        grouped_shapes = shapes_grouped_lat_long.merge(shapes.groupby('shape_id').agg(dist_traveled=('shape_dist_traveled', list)), on='shape_id', how='inner')
        grouped_shapes['total_dist_traveled'] = grouped_shapes['dist_traveled'].apply(lambda x: x[-1])

        # Merge trips with shapes
        trips_shapes = trips.merge(grouped_shapes, on='shape_id', how='inner')
        trips_shapes_routes = trips_shapes.merge(routes, on='route_id', how='inner')
        stop_times_trips_shapes = stop_times.merge(trips_shapes_routes, on='trip_id', how='inner')
        stop_times_trips_shapes_stops = stop_times_trips_shapes.merge(stops, on='stop_id', how='inner')

        app.config['STOP_TIMES'] = stop_times
        app.config['ROUTES'] = routes
        app.config['STOPS'] = stops
        app.config['TRIPS'] = trips
        app.config['TRIPS_ROUTES'] = trips_routes
        app.config['STOP_TIMES_TRIPS'] = stop_times_trips
        app.config['STOP_TIMES_TRIPS_SHAPES_STOPS'] = stop_times_trips_shapes_stops
        app.config['GROUPED_SHAPES'] = grouped_shapes
        app.config['TRIPS_SHAPES'] = trips_shapes
        app.config['TRIPS_SHAPES_ROUTES'] = trips_shapes_routes

        # Return success message
        return jsonify({'message': 'GTFS data cleaned successfully!'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/pareto_chart', methods=['GET'])
def pareto_chart():
    try:
        # Assuming routes_with_trips is already computed in your data loading process
        routes_with_trips = app.config['TRIPS'].groupby(by=['route_id']).agg(TotalTrips=('trip_id', 'count')).sort_values(by='TotalTrips', ascending=False).reset_index()
        routes_with_trips['cum_perc'] = (routes_with_trips['TotalTrips'].cumsum() / routes_with_trips['TotalTrips'].sum() * 100).round(2)


        # Create the Pareto chart
        fig = go.Figure()

        fig.add_trace(go.Bar(
            x=routes_with_trips['route_id'],
            y=routes_with_trips['TotalTrips'],
            name='Total Trips',
            marker_color='blue'
        ))

        fig.add_trace(go.Scatter(
            x=routes_with_trips['route_id'],
            y=routes_with_trips['cum_perc'],
            name='Cumulative Percentage',
            marker_color='red',
            yaxis='y2',
            mode='lines+markers'
        ))

        fig.add_trace(go.Scatter(
            x=routes_with_trips['route_id'],
            y=[80] * routes_with_trips.shape[0],
            yaxis='y2',
            mode='lines',
            line=dict(color='black', dash='dash'),
            name='80% Mark'
        ))

        fig.update_layout(
            title='Pareto Chart of Total Trips by Route',
            xaxis_title='Route ID',
            yaxis_title='Total Trips',
            yaxis2=dict(
                title='Cumulative Percentage',
                overlaying='y',
                side='right',
                range=[0, 100]
            ),
            barmode='overlay',
            legend=dict(x=0, y=1),
            showlegend=True
        )

        # Save the figure as an image (optional)
        fig.write_image("pareto_chart.png")  # Save to file
        return jsonify({'message': 'Pareto chart created successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/total_stops_vs_total_trips', methods=['GET'])
def total_stops_vs_total_trips():
    try:
        # Assuming routes_metrics is already computed in your data loading process
        routes_metrics = app.config['STOP_TIMES_TRIPS_SHAPES_STOPS'].groupby(by=['route_id']).agg(
            TotalStops=('stop_id', 'nunique'),
            TotalTrips=('trip_id', 'nunique'),
            TotalShapes=('shape_id', 'nunique')
        ).sort_values(by='TotalStops', ascending=False).reset_index()

        # Create scatter plot
        fig = px.scatter(routes_metrics,
                         x='TotalStops',
                         y='TotalTrips',
                         text='route_id',
                         title='Total Stops vs. Total Trips for Each Route',
                         labels={'TotalStops': 'Total Stops', 'TotalTrips': 'Total Trips'},
                         trendline='ols',  # Optional: Add a trendline
                         template='plotly_dark')

        fig.update_traces(textposition='top center')

        # Save the figure as an image (optional)
        fig.write_image("total_stops_vs_total_trips.png")  # Save to file
        return jsonify({'message': 'Total Stops vs. Total Trips scatter plot created successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/frequent_stops', methods=['GET'])
def frequent_stops():
    try:
        # Retrieve the merged stop_times_trips_shapes_stops DataFrame
        stop_times_trips_shapes_stops = app.config.get('STOP_TIMES_TRIPS_SHAPES_STOPS')
        if stop_times_trips_shapes_stops is None:
            return jsonify({'error': 'GTFS data has not been cleaned yet. Please call the /clean_data endpoint first.'}), 400

        # Calculate frequent stops
        frequent_stops = stop_times_trips_shapes_stops.groupby(by=['stop_id']).agg(
            TotalTrips=('trip_id', 'nunique'),
        ).sort_values(by='TotalTrips', ascending=False).reset_index()

        # Calculate cumulative percentage
        frequent_stops['cum_perc'] = (frequent_stops['TotalTrips'].cumsum() / frequent_stops['TotalTrips'].sum() * 100).round(2)

        # Filter for most frequent stops contributing to 80% of trips
        most_frequent_stops = frequent_stops[frequent_stops['cum_perc'] < 81]

        # Count and percentage of stops contributing to 80% of trips
        number_of_stops = most_frequent_stops.shape[0]
        percent_of_stops = (number_of_stops / frequent_stops.shape[0] * 100).round(2)

        result = {
            'number_of_stops': number_of_stops,
            'percent_of_stops': percent_of_stops,
            'most_frequent_stops': most_frequent_stops.to_dict(orient='records')  # Convert to list of dictionaries
        }

        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/route_metrics', methods=['GET'])
def route_metrics():
    try:
        # Retrieve the merged stop_times_trips_shapes_stops DataFrame
        stop_times_trips_shapes_stops = app.config.get('STOP_TIMES_TRIPS_SHAPES_STOPS')
        if stop_times_trips_shapes_stops is None:
            return jsonify({'error': 'GTFS data has not been cleaned yet. Please call the /clean_data endpoint first.'}), 400

        # Calculate route metrics
        routes_metrics = stop_times_trips_shapes_stops.groupby(by=['route_id']).agg(
            TotalStops=('stop_id', 'nunique'),
            TotalTrips=('trip_id', 'nunique'),
            TotalShapes=('shape_id', 'nunique')
        ).sort_values(by='TotalStops', ascending=False).reset_index()

        # Prepare stop_times for further calculations
        stop_times = app.config['STOP_TIMES'].sort_values(by=['trip_id', 'stop_sequence'])
        stop_times['time_diff'] = stop_times.groupby(by="trip_id")['arrival_time'].diff().dt.total_seconds() / 60
        stop_times['time_diff'] = stop_times['time_diff'].fillna(0)

        merged_data = pd.merge(stop_times, app.config['TRIPS'][['trip_id', 'shape_id']], on='trip_id')

        merged_data = pd.merge(merged_data, app.config['ROUTES'][['shape_id', 'shape_pt_sequence', 'shape_dist_traveled']],
                               left_on=['shape_id', 'stop_sequence'],
                               right_on=['shape_id', 'shape_pt_sequence'])

        merged_data = merged_data.sort_values(by=['trip_id', 'stop_sequence'])

        merged_data['distance_covered'] = merged_data.groupby('trip_id')['shape_dist_traveled'].diff().fillna(0)

        # Average travel time and Total distance for each trip
        trips_metrics = merged_data.groupby(by=['trip_id']).agg(
            AvgTravelTime=('time_diff', 'mean'),
            TotalDistance=('distance_covered', 'sum')
        ).reset_index()

        # Merging with routes
        trips_metrics = trips_metrics.merge(app.config['TRIPS'][['trip_id', 'route_id']], on='trip_id', how='inner')

        routes_metrics1 = trips_metrics.groupby(by=['route_id']).agg(
            AvgTravelTime=('AvgTravelTime', 'mean'),
            TotalDistance=('TotalDistance', 'sum')
        ).reset_index()

        routes_metrics = routes_metrics.merge(routes_metrics1, on="route_id", how="inner")

        # Create scatter plot
        fig = px.scatter(routes_metrics,
                         x='TotalDistance',
                         y='AvgTravelTime',
                         text='route_id',
                         title='Average Travel Time vs. Total Distance for Each Route',
                         labels={'TotalDistance': 'Total Distance (km)', 'AvgTravelTime': 'Average Travel Time (minutes)'},
                         trendline='ols',  # Optional: Add a trendline
                         template='plotly_dark')

        # Display route ID on hover
        fig.update_traces(textposition='top center')

        # Save plot to a BytesIO object
        img_bytes = io.BytesIO()
        fig.write_image(img_bytes, format='png')
        img_bytes.seek(0)

        # Encode to base64 for JSON response
        plot_url = base64.b64encode(img_bytes.getvalue()).decode('utf8')

        return jsonify({
            'routes_metrics': routes_metrics.to_dict(orient='records'),  # Return metrics as a list of dictionaries
            'plot_url': f"data:image/png;base64,{plot_url}"
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/plot_route', methods=['GET'])
def plot_route_on_map_api():
    route_id = request.args.get('route_id')

    if not route_id:
        return jsonify({"status": "error", "message": "route_id parameter is required."}), 400
    
    trips = app.config['TRIPS']
    stops = app.config['STOPS']
    stop_times = app.config['STOP_TIMES']
    shapes = app.config['SHAPES']

    trips_filtered = trips[trips['route_id'] == route_id]
    trip_ids = trips_filtered['trip_id'].unique()
    stop_times_filtered = stop_times[stop_times['trip_id'].isin(trip_ids)]
    stop_data = pd.merge(stop_times_filtered, stops, on='stop_id')

    stop_data = stop_data.sort_values(by=['trip_id', 'stop_sequence'])
    first_stop = stop_data.groupby('trip_id').first().reset_index()
    last_stop = stop_data.groupby('trip_id').last().reset_index()
    shape_id = trips_filtered.iloc[0]['shape_id']
    shape_data = shapes[shapes['shape_id'] == shape_id].sort_values(by='shape_pt_sequence')

    map_center = [first_stop.iloc[0]['stop_lat'], first_stop.iloc[0]['stop_lon']]
    route_map = folium.Map(location=map_center, zoom_start=12)

    marker_cluster = MarkerCluster().add_to(route_map)

    for _, row in stop_data.iterrows():
        Marker(
            location=[row['stop_lat'], row['stop_lon']],
            popup=f"Stop: {row['stop_name']} (Sequence: {row['stop_sequence']})",
            icon=folium.Icon(color='blue', icon='info-sign')
        ).add_to(marker_cluster)

    Marker(
        location=[first_stop.iloc[0]['stop_lat'], first_stop.iloc[0]['stop_lon']],
        popup=f"Source: {first_stop.iloc[0]['stop_name']}",
        icon=folium.Icon(color='green', icon='play')
    ).add_to(route_map)

    Marker(
        location=[last_stop.iloc[0]['stop_lat'], last_stop.iloc[0]['stop_lon']],
        popup=f"Destination: {last_stop.iloc[0]['stop_name']}",
        icon=folium.Icon(color='red', icon='stop')
    ).add_to(route_map)

    shape_coords = shape_data[['shape_pt_lat', 'shape_pt_lon']].values.tolist()
    folium.PolyLine(locations=shape_coords, color='purple', weight=5, opacity=0.7).add_to(route_map)

    route_map.save(f"{route_id}_route_map.html")  # Save the map as an HTML file
    return jsonify({"status": "success", "message": "Map created.", "map_file": f"{route_id}_route_map.html"})


@app.route('/train_model', methods=['POST'])
def train_model():

    stop_times_trips_shapes_stops = app.config['STOP_TIMES_TRIPS_SHAPES_STOPS']

    # Calculate travel time and distance traveled
    stop_times_trips_shapes_stops['travel_time'] = stop_times_trips_shapes_stops.groupby(by="trip_id")['arrival_time'].diff().dt.total_seconds().fillna(0)
    stop_times_trips_shapes_stops['distance_traveled'] = stop_times_trips_shapes_stops.groupby('trip_id')['shape_dist_traveled'].diff().fillna(0)

    # Convert IDs to integers
    stop_times_trips_shapes_stops['route_id_int'] = stop_times_trips_shapes_stops['route_id'].astype(int)
    stop_times_trips_shapes_stops['trip_id_int'] = stop_times_trips_shapes_stops['trip_id'].astype(int)
    stop_times_trips_shapes_stops['stop_id_int'] = stop_times_trips_shapes_stops['stop_id'].astype(int)

    # Select features and target variable for the model
    X = stop_times_trips_shapes_stops[['stop_sequence', 'distance_traveled', 'route_id_int', 'trip_id_int']]
    y = stop_times_trips_shapes_stops['travel_time']

    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train the Random Forest model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Make predictions
    y_pred = model.predict(X_test)

    # Create a scatter plot for actual vs predicted travel time
    plt.figure(figsize=(10, 6))
    plt.scatter(y_test, y_pred, alpha=0.3)
    plt.xlabel('Actual Travel Time (seconds)')
    plt.ylabel('Predicted Travel Time (seconds)')
    plt.title('Actual vs Predicted Travel Time')

    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.write_image('actual_pred.png')
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()

    return jsonify({"status": "success", "message": "Model trained successfully.", "plot": f"data:image/png;base64,{img_str}"})


@app.route('/cluster_stops', methods=['POST'])
def cluster_stops():
    stops_df = app.config['STOPS']

    if 'stop_lat' not in stops_df.columns or 'stop_lon' not in stops_df.columns:
        return jsonify({"status": "error", "message": "Missing latitude or longitude columns."}), 400

    # Prepare the data for clustering
    stop_coords = stops_df[['stop_lat', 'stop_lon']].values

    # Perform KMeans clustering
    kmeans = KMeans(n_clusters=10, random_state=42)
    stops_df['cluster'] = kmeans.fit_predict(stop_coords)

    # Create a scatter plot of the clusters
    plt.figure(figsize=(10, 6))
    scatter = plt.scatter(stops_df['stop_lon'], stops_df['stop_lat'], c=stops_df['cluster'], cmap='Set1', alpha=0.7)

    # Adding labels and title
    plt.title('Stop Clustering')
    plt.xlabel('Longitude')
    plt.ylabel('Latitude')
    plt.colorbar(scatter, label='Cluster')

    # Save the plot to a bytes buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.write_image('cluster.png')
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()

    # Return the plot as a base64 encoded string
    return jsonify({"status": "success", "message": "Clustering completed successfully.", "plot": f"data:image/png;base64,{img_str}"})


if __name__ == '__main__':
    app.run(debug=True)
