/**
 * A static, client-side city list for the interview's location autocomplete. Not
 * exhaustive (no geocoding API in scope for this prototype, per project constraints) but
 * broad enough across continents that "start typing your city" feels real rather than
 * obviously scripted. Reverse-geocoding (for the "use my location" auto-fill) hits the
 * free, keyless Nominatim API instead, since that only needs to resolve ONE point.
 */
export const WORLD_CITIES = [
  // Canada
  'Toronto, ON', 'Ottawa, ON', 'Mississauga, ON', 'Hamilton, ON', 'London, ON', 'Windsor, ON',
  'Kitchener, ON', 'Waterloo, ON', 'Kingston, ON', 'Guelph, ON', 'Thunder Bay, ON', 'Sudbury, ON',
  'Montreal, QC', 'Quebec City, QC', 'Sherbrooke, QC', 'Gatineau, QC', 'Laval, QC',
  'Vancouver, BC', 'Victoria, BC', 'Kelowna, BC', 'Kamloops, BC', 'Surrey, BC', 'Burnaby, BC',
  'Calgary, AB', 'Edmonton, AB', 'Lethbridge, AB', 'Red Deer, AB',
  'Winnipeg, MB', 'Saskatoon, SK', 'Regina, SK',
  'Halifax, NS', 'Fredericton, NB', 'Saint John, NB', 'Charlottetown, PE', "St. John's, NL",
  'Whitehorse, YT', 'Yellowknife, NT',
  // United States
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
  'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
  'Austin, TX', 'Jacksonville, FL', 'San Francisco, CA', 'Columbus, OH', 'Charlotte, NC',
  'Indianapolis, IN', 'Seattle, WA', 'Denver, CO', 'Boston, MA', 'Nashville, TN',
  'Detroit, MI', 'Portland, OR', 'Memphis, TN', 'Louisville, KY', 'Baltimore, MD',
  'Milwaukee, WI', 'Albuquerque, NM', 'Tucson, AZ', 'Fresno, CA', 'Sacramento, CA',
  'Atlanta, GA', 'Miami, FL', 'Cleveland, OH', 'Minneapolis, MN', 'Pittsburgh, PA',
  'Raleigh, NC', 'Cincinnati, OH', 'St. Louis, MO', 'Orlando, FL', 'Tampa, FL',
  'Kansas City, MO', 'New Orleans, LA', 'Salt Lake City, UT', 'Buffalo, NY', 'Providence, RI',
  'Richmond, VA', 'Hartford, CT', 'Ann Arbor, MI', 'Chapel Hill, NC', 'Berkeley, CA',
  'Palo Alto, CA', 'Cambridge, MA', 'New Haven, CT', 'Ithaca, NY', 'Princeton, NJ',
  'Washington, DC', 'Baton Rouge, LA', 'Madison, WI', 'Columbia, SC', 'Boulder, CO',
  'Honolulu, HI', 'Anchorage, AK',
  // United Kingdom & Ireland
  'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Edinburgh, UK', 'Glasgow, UK',
  'Bristol, UK', 'Leeds, UK', 'Liverpool, UK', 'Oxford, UK', 'Cambridge, UK', 'Belfast, UK',
  'Dublin, Ireland', 'Cork, Ireland',
  // Western Europe
  'Paris, France', 'Lyon, France', 'Marseille, France', 'Toulouse, France',
  'Berlin, Germany', 'Munich, Germany', 'Hamburg, Germany', 'Frankfurt, Germany', 'Cologne, Germany',
  'Madrid, Spain', 'Barcelona, Spain', 'Valencia, Spain', 'Seville, Spain',
  'Rome, Italy', 'Milan, Italy', 'Naples, Italy', 'Turin, Italy', 'Florence, Italy',
  'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'The Hague, Netherlands',
  'Brussels, Belgium', 'Antwerp, Belgium',
  'Zurich, Switzerland', 'Geneva, Switzerland', 'Basel, Switzerland', 'Lausanne, Switzerland',
  'Vienna, Austria', 'Lisbon, Portugal', 'Porto, Portugal',
  'Dublin, Ireland', 'Luxembourg City, Luxembourg',
  // Northern Europe
  'Stockholm, Sweden', 'Gothenburg, Sweden', 'Oslo, Norway', 'Bergen, Norway',
  'Copenhagen, Denmark', 'Aarhus, Denmark', 'Helsinki, Finland', 'Reykjavik, Iceland',
  // Central & Eastern Europe
  'Warsaw, Poland', 'Krakow, Poland', 'Prague, Czechia', 'Budapest, Hungary',
  'Bucharest, Romania', 'Vilnius, Lithuania', 'Riga, Latvia', 'Tallinn, Estonia',
  'Kyiv, Ukraine', 'Moscow, Russia', 'Saint Petersburg, Russia',
  'Athens, Greece', 'Zagreb, Croatia', 'Belgrade, Serbia',
  // Middle East
  'Istanbul, Turkey', 'Ankara, Turkey', 'Tel Aviv, Israel', 'Jerusalem, Israel',
  'Dubai, UAE', 'Abu Dhabi, UAE', 'Doha, Qatar', 'Riyadh, Saudi Arabia', 'Amman, Jordan', 'Beirut, Lebanon',
  // Africa
  'Cairo, Egypt', 'Lagos, Nigeria', 'Nairobi, Kenya', 'Cape Town, South Africa',
  'Johannesburg, South Africa', 'Accra, Ghana', 'Addis Ababa, Ethiopia', 'Casablanca, Morocco',
  'Tunis, Tunisia', 'Kigali, Rwanda',
  // South & Central Asia
  'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Hyderabad, India', 'Chennai, India',
  'Kolkata, India', 'Pune, India', 'Ahmedabad, India',
  'Karachi, Pakistan', 'Lahore, Pakistan', 'Islamabad, Pakistan',
  'Dhaka, Bangladesh', 'Colombo, Sri Lanka', 'Kathmandu, Nepal',
  // East & Southeast Asia
  'Beijing, China', 'Shanghai, China', 'Shenzhen, China', 'Guangzhou, China', 'Hong Kong',
  'Tokyo, Japan', 'Osaka, Japan', 'Kyoto, Japan', 'Yokohama, Japan',
  'Seoul, South Korea', 'Busan, South Korea',
  'Taipei, Taiwan', 'Singapore',
  'Bangkok, Thailand', 'Jakarta, Indonesia', 'Manila, Philippines', 'Kuala Lumpur, Malaysia',
  'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam',
  // Oceania
  'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia',
  'Adelaide, Australia', 'Canberra, Australia',
  'Auckland, New Zealand', 'Wellington, New Zealand', 'Christchurch, New Zealand',
  // Latin America
  'Mexico City, Mexico', 'Guadalajara, Mexico', 'Monterrey, Mexico',
  'Sao Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Brasilia, Brazil',
  'Buenos Aires, Argentina', 'Santiago, Chile', 'Lima, Peru', 'Bogota, Colombia',
  'Quito, Ecuador', 'San Jose, Costa Rica', 'Panama City, Panama',
]

export function searchCities(query, limit = 6) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const starts = []
  const contains = []
  for (const city of WORLD_CITIES) {
    const lower = city.toLowerCase()
    if (lower.startsWith(q)) starts.push(city)
    else if (lower.includes(q)) contains.push(city)
    if (starts.length >= limit) break
  }
  return [...starts, ...contains].slice(0, limit)
}
