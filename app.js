const express = require('express');
const ejs = require('ejs');
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const flamelink = require('flamelink/app');
require('flamelink/content');
require('flamelink/storage');
const mailgun = require("mailgun-js");
require('dotenv').config()
const configRote = require('./prolizingas-firebase-adminsdk-fj266-3a67da9db6.json');
const compression = require('compression')
const mcache = require('memory-cache');
const NodeCache = require( "node-cache" );
const carListCache = new NodeCache({ stdTTL: 2000 , useClones: false});
const myCache= new NodeCache({ stdTTL: 2000 , useClones: false});
const app = express();

app.use(compression());
app.use(express.static(__dirname+"/public"));
app.set('views', './views' )
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: false}));

var cache = (duration) => {
  return (req, res, next) => {
    let key = '__express__' + req.originalUrl || req.url
    let cachedBody = mcache.get(key)
    if (cachedBody) {
      res.send(cachedBody)
      return
    } else {
      res.sendResponse = res.send
      res.send = (body) => {
        mcache.put(key, body, duration * 1000);
        res.sendResponse(body)
      }
      next()
    }
  }
}

const firebaseConfig = {
    credential: admin.credential.cert(configRote),
    databaseURL: process.env.DATABASE_URL,
    storageBucket: process.env.STORAGE
  }
  
const firebaseApp = admin.initializeApp(firebaseConfig)
  
const db = admin.firestore();
  
const flameApp = flamelink({
    firebaseApp,
    dbType: 'cf'
})


async function carList (){

  const savedCarList = carListCache.get('forCarList');
  if(savedCarList) {
    return savedCarList
  }
  try {
    const carList = await flameApp.content.get({
      schemaKey: 'newCar',
      populate: true,
      fields: ['id', 'carModel', 'city', 'carMake', 'carYear', 'carPrice', 'carImages', '_fl_meta_','fuelType', 'bodyType'],
      orderBy: { field: '_fl_meta_.createdDate', order: 'desc' } 

    });

    const modelSchema = Object.values(carList).map(i => {
      return {carModel:i.carModel, 
              carMake: i.carMake}
    });

    await Promise.all(Object.values(carList).map(async (item) => {
      try {
          const carImg = await flameApp.storage.getURL({
              fileId: item.carImages[0].id,
              size: {
                  path: '375_9999_99'
                }
          })
          item.carImage = carImg;
      } catch (error) {
          return error
      }
    }));

    let forFilter = {
      carList: carList,
      distinctMake: Object.values(carList).map(item => item.carMake).filter((value, index, self) => self.indexOf(value) === index).sort(),
      distinctCity: Object.values(carList).map(item => item.city).filter((value, index, self) => self.indexOf(value) === index).sort(),
      distinctYear: Object.values(carList).map(item => item.carYear).filter((value, index, self) => self.indexOf(value) === index).sort(),
      distinctModel: [...new Map(modelSchema.map(item => [item['carModel'], item])).values()]
    }

    carListCache.set('forCarList', forFilter, 2000);
    return forFilter
  } catch (error) {
    return error
  }
}

async function getCars (limitTo) {

  const forCars = myCache.get('forCar');

  if(forCars == undefined) {
    try {
      const cars = await flameApp.content.get({
        schemaKey: 'newCar',
        populate: true,
        fields: ['id', 'carModel', 'city', 'carMake', 'carYear', 'carPrice', 'carImages', '_fl_meta_', ,'fuelType', 'bodyType'],
        orderBy: "carMake",
        limit: limitTo
      });
      myCache.set('forCar', cars, 2000);
      return cars
    } catch (error) {
      return error
    }
  }else {
    return forCars
  }
}

app.get("/",cache(1001), async(req, res, next) => {
  
    if(Object.keys(req.query).length === 0){
      try {

        const filters = await carList();

        res.set('Cache-Control', 'public, max-age=1000, s-maxage=6000');
        res.render('index', {auto : filters.carList, carMakeFilter : filters.distinctMake, carModelFilter : filters.distinctModel, city : filters.distinctCity, year: filters.distinctYear});

      } catch (error) {
        res.render('404')
        console.log(error);
      }
    } else {
  
      const filterQuery = [];
        
      if(req.query.make) {
        const filterParam = ['carMake', '==', `${req.query.make}`];
        filterQuery.push(filterParam)
      }
      if(req.query.model) {
        const filterParam = ['carModel', '==', `${req.query.model}`];
        filterQuery.push(filterParam)
      }
      if(req.query.yearFrom) {
        const filterParam = ['carYear', '>=', parseInt(req.query.yearFrom)];
        filterQuery.push(filterParam)
      }
      if(req.query.yearTo) {
        const filterParam = ['carYear', '<=', parseInt(req.query.yearTo)];
        filterQuery.push(filterParam)
      }
      if(req.query.bodyType) {
        const filterParam = ['bodyType', '==', `${req.query.bodyType}`];
        filterQuery.push(filterParam)
      }
      if(req.query.fuelType) {
        const filterParam = ['fuelType', '==', `${req.query.fuelType}`];
        filterQuery.push(filterParam)
      }
      if(req.query.city) {
        const filterParam = ['city', '==', `${req.query.city}`];
        filterQuery.push(filterParam)
      }
      if(req.query.priceLimit) {
        const filterParam = ['carPrice', '<=', parseInt(req.query.priceLimit)];
        filterQuery.push(filterParam)
      }
      if(req.query.page) {
        page = parseInt(req.query.page);
      }

      if(req.query.priceLimit && (req.query.yearFrom || req.query.yearTo)){
        filterQuery.pop();
        try{
          const filteredCar = await flameApp.content.get({
            schemaKey: 'newCar',
            populate: true,
            filters: filterQuery,
            fields: ['id', 'carModel', 'city', 'carMake', 'carYear', 'carPrice', 'carImages'],
            limit: 9
          });

          const filters = await carList();

          await Promise.all(Object.values(filteredCar).map(async (item) => {
            try {
                const carImg = await flameApp.storage.getURL({
                    fileId: item.carImages[0].id,
                    size: {
                        path: '375_9999_99'
                      }
                })
                item.carImage = carImg;
            } catch (error) {
                return error
            }
          }));

          res.set('Cache-Control', 'public, max-age=1000, s-maxage=6000');
          res.render('index', {auto : filteredCar, carMakeFilter : filters.distinctMake, carModelFilter : filters.distinctModel, city : filters.distinctCity, year: filters.distinctYear});

        }catch (error) {
          console.log(error);
        const item = [];
        res.render('index', {auto: item, carMakeFilter : filters.distinctMake, carModelFilter : filters.distinctModel, city : filters.distinctCity, year: filters.distinctYear});
        }
      

      }else {
        try{
          const filteredCar = await flameApp.content.get({
            schemaKey: 'newCar',
            populate: true,
            filters: filterQuery,
            fields: ['id', 'carModel', 'city', 'carMake', 'carYear', 'carPrice', 'carImages'],
            limit: 9
          });

          const filters = await carList()

          await Promise.all(Object.values(filteredCar).map(async (item) => {
            try {
                const carImg = await flameApp.storage.getURL({
                    fileId: item.carImages[0].id,
                    size: {
                        path: '375_9999_99'
                      }
                })
                item.carImage = carImg;
            } catch (error) {
                return error
            }
          }));
  
          res.set('Cache-Control', 'public, max-age=1000, s-maxage=6000');

          res.render('index', {auto : filteredCar, carMakeFilter : filters.distinctMake, carModelFilter : filters.distinctModel, city : filters.distinctCity, year: filters.distinctYear});

        }catch (error) {
          const item = [];
          res.render('index', {auto: item, carMakeFilter : filters.distinctMake, carModelFilter : filters.distinctModel, city : filters.distinctCity, year: filters.distinctYear});
        }

      }
  
    }
  
});

app.get("/automobiliai/:id", cache(1001), async(req, res) => {
    let id = req.params.id;
    const auto = [];
  
    try {
      const car = await flameApp.content.get({
      schemaKey: 'newCar',
      entryId: id,
      populate: true,
      fields: ['id', 'gearBox','carMiles', 'carColor', 'carEngine','fuelType', 'bodyType', 'carComment', 'carModel', 'city', 'carMake', 'carYear', 'carPrice', 'carImages', 'partnerName', , 'partnerNumber', 'partnerAdress']
      });
        auto.push(car);
    } catch (error) {
      res.render("404")
    }
  
    try {
      const partner = await flameApp.content.getByField({
      schemaKey: 'newCar',
      field: 'partnerName',
      value: auto[0].partnerName,
      fields: ['id', 'carModel', 'city', 'carMake', 'carEngine' ,'gearBox', 'carYear', 'fuelType', 'carPrice', 'carImages', 'partnerName'],
      populate: [
        {
          field: 'carImages',
          fields: ['url']
        }
      ],
      limit: 5
    });
  
      let partnerItem = Object.values(partner).map(i => ({...i, carImages:(i.carImages || []).map(j => j.url)}));  
      partnerItem = partnerItem.filter(item => item.id !== id);
      res.set('Cache-Control', 'public, max-age=1000, s-maxage=6000');
      res.render('item', {auto : auto, partner: partnerItem});
    } catch (error) {
      res.render("404");
    }
  
});

app.post("/form", (req, res) => {

    const DOMAIN = "sandbox5daed18ec69e4657a4dce1f274597578.mailgun.org";
    const mg = mailgun({apiKey: process.env.MAIL_GUN_API, domain: DOMAIN});

    const data = {
      from: "Mailgun Sandbox <postmaster@sandbox5daed18ec69e4657a4dce1f274597578.mailgun.org>",
      to: "prolizingas@paskola23.lt",
      subject: "Prolizingo forma",
      text: `
          Vardas: ${req.body.name},
          Pavardė: ${req.body.lastName},
          Asmens kodas: ${req.body.idNum},
          Tel Nr: ${req.body.mobile},
          Email: ${req.body.email},
          Paskutinės darbovietės darbo stažas: ${req.body.work},
          Nuoroda: "prolizingas.lt/automobiliai/${req.body.autoLink},
          Automobilio Markė: ${req.body.autoMake},
          Automobilio Modelis: ${req.body.autoModel},
          Automobilio Kaina: ${req.body.autoPrice},
          Automobilio Kėbulo tipas: ${req.body.autoBody},
          Automobilio Metai: ${req.body.autoYear},
          Automobilio Kuro tipas: ${req.body.autoFuel},
          Automobilio Pavarū dėžė : ${req.body.autoGear}`
          
        };
        mg.messages().send(data, function (error, body) {
            console.log(body);
        });

    res.render('form' ,{name: req.body.name});
});

app.use(function (req, res, next) {
    res.status(404).render('404')
  })

let port = process.env.PORT;

if(port == null || ''){
    port = 3000;
}

app.listen(port)
  

