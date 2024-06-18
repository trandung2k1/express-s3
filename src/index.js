require('dotenv').config();
const express = require('express');
const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const colors = require('colors');
const multerS3 = require('multer-s3');
const path = require('path');
const multer = require('multer');
const { notFound, errorHandlingMiddleware } = require('./middlewares/errorHandlingMiddleware');
aws.config.update({
    secretAccessKey: process.env.ACCESS_SECRET,
    accessKeyId: process.env.ACCESS_KEY,
    region: process.env.REGION,
});
const BUCKET_NAME = process.env.BUCKET_NAME;
const s3 = new aws.S3();
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, Date.now() + path.extname(file.originalname));
        },
    }),
});
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan('combined'));
app.use(helmet());
app.disable('x-powered-by');
const port = process.env.PORT || 3000;
app.get('/', (req, res) => {
    return res.send('Welcome to the server!');
});
app.get('/download/:filename', async (req, res) => {
    const filename = req.params.filename;
    try {
        const x = await s3.getObject({ Bucket: BUCKET_NAME, Key: filename }).promise();
        return res.send(x.Body);
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
});

app.delete('/delete/:filename', async (req, res) => {
    const filename = req.params.filename;
    try {
        await s3.deleteObject({ Bucket: BUCKET_NAME, Key: filename }).promise();
        return res.status(200).json({
            data: 'Delet file successfully',
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});
app.post('/upload', upload.single('file'), async function (req, res) {
    return res.status(201).json({
        data: 'Upload file successfully',
        location: req.file.location,
    });
});
app.get('/list', async (req, res) => {
    try {
        const r = await s3.listObjectsV2({ Bucket: BUCKET_NAME }).promise();
        const x = r.Contents.map((item) => item);
        return res.status(200).json({ data: x });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
});

app.use(notFound);
app.use(errorHandlingMiddleware);
app.listen(port, () => console.log(colors.green(`Server listening on http://localhost:${port}`)));
module.exports = app;
