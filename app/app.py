from flask import Flask, jsonify, request
import pandas as pd
import folium
from folium.plugins import HeatMap, MarkerCluster
from shapely.geometry import Point

import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px

from shapely.geometry import Point, Polygon, MultiPolygon

from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor


app = Flask(__name__)


def modify_time(row):
#     print(row)
    if type(row) is not float: 
        time_parts = row.split(":")
        time_parts[0] = str(int(time_parts[0]) % 24)
        return ":".join(time_parts)
    return np.nan


def classify_time_of_day(hour):
    if 8 <= hour < 10:
        return 'Rush Hour (Morning)'
    elif 6 <= hour < 11:
        return 'Morning'
    elif 12 <= hour < 16:
        return 'Afternoon'
    elif 17 <= hour < 20:
        return 'Rush Hour (Evening)'
    elif 20 <= hour <= 23:
        return 'Night'
    else:
        return 'Other'


def load_and_clean_data():
    filename = "data/mta_1712.csv"
    raw_df = pd.read_csv(filename, on_bad_lines="skip")
    data_df_0 = raw_df.dropna(subset=['OriginName', 'NextStopPointName']).reset_index(drop=True)

    data_df_0['RecordedDate'] = data_df_0.apply(lambda x: x['RecordedAtTime'].split()[0], axis=1)
    data_df_0['ModifiedScheduledTime'] = (data_df_0['RecordedDate'] + " " + data_df_0['ScheduledArrivalTime'].apply(modify_time))
    
    # Modify and clean timestamps
    data_df_0['RecordedAtTime'] = pd.to_datetime(data_df_0.RecordedAtTime)
    data_df_0['RecordedDate'] = pd.to_datetime(data_df_0.RecordedDate)
    data_df_0['ExpectedArrivalTime'] = pd.to_datetime(data_df_0.ExpectedArrivalTime, errors='coerce')
    data_df_0['ModifiedScheduledTime'] = pd.to_datetime(data_df_0.ModifiedScheduledTime, errors='coerce')

    data_df_0['ExpectedArrivalTime'].fillna(data_df_0['ModifiedScheduledTime'], inplace=True)
    # Drop the null values from ModifiedScheduledTime
    data_df_0.dropna(subset=['ModifiedScheduledTime'], inplace=True)

    data0 = data_df_0.copy()

    data0['Delay'] = (data0['ExpectedArrivalTime'] - data0['ModifiedScheduledTime']).dt.total_seconds() / 60.0
    data0['Day'] = data0['RecordedAtTime'].dt.day
    data0['DayOfWeek'] = data0['RecordedAtTime'].dt.dayofweek
    data0['Hour'] = data0['RecordedAtTime'].dt.hour

    data0['TimeOfDay'] = data0['Hour'].apply(classify_time_of_day)

    Q1 = data0['Delay'].quantile(0.25)
    Q3 = data0['Delay'].quantile(0.75)
    
    IQR = Q3 - Q1
    
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    
    # print(f"Q1: {Q1}, Q3: {Q3}, IQR: {IQR}, lower bound: {lower_bound}, upper bound: {upper_bound}")

    data_df = data0[(data0['Delay'] >= lower_bound) & (data0['Delay'] <= upper_bound)]
    
    return data_df


# Initialize data globally for reuse
data = load_and_clean_data()


@app.route('/route-analysis', methods=['GET'])
def route_analysis():
    route_analysis = data.groupby('PublishedLineName').agg(
        AvgDelays=('Delay', 'mean'),
        TotalTrips=('VehicleRef', 'count')
    ).reset_index()
    
    return jsonify(route_analysis.to_dict(orient='records'))

@app.route('/delay-distribution', methods=['GET'])
def delay_distribution():
    plt.figure(figsize=(10, 6))
    sns.histplot(data=data, x='Delay', bins=100, kde=True)
    plt.title('Distribution of Delays')
    plt.xlabel('Delay (minutes)')
    plt.ylabel('Frequency')
    plt.savefig('static/delay_distribution.png')
    
    return jsonify({'message': 'Delay distribution graph saved as PNG', 'path': '/static/delay_distribution.png'})


@app.route('/delayed-origins-heatmap', methods=['GET'])
def delayed_origins_heatmap():
    most_imp_origins = data.groupby('OriginName').agg(
        AvgDelay=('Delay', 'mean'),
        TotalTrips=('VehicleRef', 'count')
    ).reset_index().sort_values(by='AvgDelay', ascending=False).head(10)
    
    m = folium.Map(location=[40.7128, -74.0060], zoom_start=12)
    HeatMap(most_imp_origins[['OriginLat', 'OriginLong', 'AvgDelay']].values, radius=10).add_to(m)
    m.save('static/heatmap.html')
    
    return jsonify({'message': 'Heatmap created', 'path': '/static/heatmap.html'})

@app.route('/trips', methods=['GET'])
def get_trips():
    date = request.args.get('date', None)
    min_delay = float(request.args.get('min_delay', 0))
    
    filtered_data = data[data['Delay'] >= min_delay]
    if date:
        filtered_data = filtered_data[filtered_data['RecordedAtTime'].dt.date == pd.to_datetime(date).date()]
    
    trips = filtered_data[['VehicleRef', 'OriginName', 'DestinationName', 'Delay']].to_dict(orient='records')
    
    return jsonify(trips)


if __name__ == '__main__':
    app.run(debug=True)
