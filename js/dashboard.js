const chart1 = document.getElementById('chart1');
const chart2 = document.getElementById('chart2');

let percentage_distribution = {}
let entities = []
let last_entity = []

const PATH = '/api/';

function getUUID() {
    // "uuid" get parameter
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('uuid');
}

async function getEntitiesData() {
    await axios.get(PATH + '/entities/' + getUUID()).then(function (response) {
        entities = response.data;

        const labels = []
        const progress_data = {
            labels: labels,
            datasets: [{
                label: 'Progress Over Time',
                data: [],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        };

        // Loop through entities
        for (let i = 0; i < entities.length; i++) {
            let entity = entities[i]
            labels.push(entity.date_created);
            progress_data['datasets'][0]['data'].push(entity.percentage)
        }

        new Chart(chart2, {
            type: 'line',
            data: progress_data,
        })
    })
        .catch(function (error) {
            console.log(error);
        })
}

function getLastEntityData() {
    let entity_id = entities[entities.length - 1].id
    axios.get(PATH + '/entities/' + getUUID() + '/' + entity_id).then(function (response) {
        last_entity = response.data;
        console.log(last_entity);
        // Loop through last_entity's segments
        for (let i = 0; i < last_entity.segments.length; i++) {
            let segment = last_entity.segments[i]
            if(percentage_distribution[segment.category_title] === undefined) {
                percentage_distribution[segment.category_title] = segment.area
            } else {
                percentage_distribution[segment.category_title] += segment.area
            }
        }
        let percentage_data = {
            datasets: [{
                // Values of percentage_distribution
                data: Object.values(percentage_distribution),
            }],

            // These labels appear in the legend and in the tooltips when hovering different arcs
            labels: Object.keys(percentage_distribution)
        };
        new Chart(chart1, {
            type: 'doughnut',
            data: percentage_data,
        })

        let title = document.getElementById('title');
        let subtitle = document.getElementById('subtitle');
        let progress = document.getElementById('progress');
        let image = document.getElementById('latest-photo');

        title.innerHTML = last_entity.percentage + '%';
        progress.value = last_entity.percentage;
        subtitle.innerHTML = "The most identifiable entity is " + last_entity.most_significant_detection + " with " + last_entity.most_significant_area + " pixels covered.";
        image.src = last_entity.image
    })

        .catch(function (error) {
            console.log(error);
        })
}

getEntitiesData().then(() => {
    getLastEntityData()
});

document.getElementById('return-link').href = "camera.html?uuid=" + getUUID();

