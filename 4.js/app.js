const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const hbs = require('hbs');
const { engine } = require('express-handlebars');
const { Pool } = require('pg');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { format } = require('date-fns');

const app = express();
const port = 3000;

// PostgreSQL connection pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'dumbways01',
    password: 'postgres01',
    port: 5432,
});

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// View engine setup
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    helpers: {
        dateString: (date) => {
            if (!date) return '';
            return format(new Date(date), 'dd MMMM yyyy'); // Format tanggal sesuai kebutuhan
        }
    }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Middleware for authentication
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Route handlers
app.get('/', async (req, res) => {
    try {
        const provincesResult = await pool.query('SELECT * FROM provinsi_tb');
        const districtsResult = await pool.query(`
            SELECT 
                kabupaten_tb.*, 
                provinsi_tb.nama AS provinsi_nama 
            FROM 
                kabupaten_tb 
            JOIN 
                provinsi_tb ON kabupaten_tb.provinsi_id = provinsi_tb.id
        `);
        res.render('home', {
            provinces: provincesResult.rows,
            districts: districtsResult.rows,
            user: req.session.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving data');
    }
});

// Province routes
app.get('/add-province', isAuthenticated, (req, res) => {
    res.render('province/add', { user: req.session.user });
});

app.post('/add-province', isAuthenticated, upload.single('photo'), async (req, res) => {
    const { nama, diresmikan, pulau } = req.body;
    const photo = req.file ? req.file.filename : null;
    const userId = req.session.user.id;

    try {
        await pool.query('INSERT INTO provinsi_tb (nama, diresmikan, photo, pulau, user_id) VALUES ($1, $2, $3, $4, $5)', [nama, diresmikan, photo, pulau, userId]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding province');
    }
});

app.get('/edit-province/:id', isAuthenticated, async (req, res) => {
    const provinceId = req.params.id;
    try {
        const result = await pool.query('SELECT * FROM provinsi_tb WHERE id = $1', [provinceId]);
        const province = result.rows[0];
        const formattedDate = province.diresmikan.toISOString().split('T')[0];
        res.render('province/edit', { province: { ...province, diresmikan: formattedDate }, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving province');
    }
});

app.post('/edit-province/:id', isAuthenticated, upload.single('photo'), async (req, res) => {
    const provinceId = req.params.id;
    const { nama, diresmikan, pulau } = req.body;
    const photo = req.file ? req.file.filename : null;
    const userId = req.session.user.id;

    try {
        if (photo) {
            await pool.query('UPDATE provinsi_tb SET nama = $1, diresmikan = $2, photo = $3, pulau = $4, user_id = $5 WHERE id = $6', [nama, diresmikan, photo, pulau, userId, provinceId]);
        } else {
            await pool.query('UPDATE provinsi_tb SET nama = $1, diresmikan = $2, pulau = $3, user_id = $4 WHERE id = $5', [nama, diresmikan, pulau, userId, provinceId]);
        }
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating province');
    }
});

app.post('/delete-province/:id', isAuthenticated, async (req, res) => {
    const provinceId = req.params.id;
    try {
        await pool.query('DELETE FROM provinsi_tb WHERE id = $1', [provinceId]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting province');
    }
});

app.get('/detail-province/:id', isAuthenticated, async (req, res) => {
    const provinceId = req.params.id;
    try {
        const result = await pool.query('SELECT * FROM provinsi_tb WHERE id = $1', [provinceId]);
        const province = result.rows[0];

        if (!province) {
            return res.status(404).send('Province not found');
        }

        const formattedDate = province.diresmikan.toISOString().split('T')[0];
        res.render('province/detail', { province: { ...province, diresmikan: formattedDate }, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving province details');
    }
});

// District routes
app.get('/add-district', isAuthenticated, async (req, res) => {
    try {
        const provincesResult = await pool.query('SELECT * FROM provinsi_tb');
        res.render('district/add', {
            user: req.session.user,
            provinces: provincesResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving provinces');
    }
});

app.post('/add-district', isAuthenticated, upload.single('photo'), async (req, res) => {
    const { nama, diresmikan, provinsi_id } = req.body;
    const userId = req.session.user.id;
    const photo = req.file ? req.file.filename : null;

    try {
        await pool.query('INSERT INTO kabupaten_tb (nama, diresmikan, provinsi_id, photo) VALUES ($1, $2, $3, $4)', [nama, diresmikan, provinsi_id, photo]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding district');
    }
});

app.get('/edit-district/:id', isAuthenticated, async (req, res) => {
    const districtId = req.params.id;
    try {
        const districtResult = await pool.query('SELECT * FROM kabupaten_tb WHERE id = $1', [districtId]);
        const district = districtResult.rows[0];
        const provincesResult = await pool.query('SELECT * FROM provinsi_tb');
        const formattedDate = district.diresmikan.toISOString().split('T')[0];

        res.render('district/edit', {
            district: { ...district, diresmikan: formattedDate },
            provinces: provincesResult.rows,
            user: req.session.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving district data');
    }
});

app.post('/edit-district/:id', isAuthenticated, upload.single('photo'), async (req, res) => {
    const districtId = req.params.id;
    const { nama, diresmikan, provinsi_id } = req.body;
    const photo = req.file ? req.file.filename : null;

    try {
        if (photo) {
            await pool.query('UPDATE kabupaten_tb SET nama = $1, diresmikan = $2, provinsi_id = $3, photo = $4 WHERE id = $5', 
                [nama, diresmikan, provinsi_id, photo, districtId]);
        } else {
            await pool.query('UPDATE kabupaten_tb SET nama = $1, diresmikan = $2, provinsi_id = $3 WHERE id = $4', 
                [nama, diresmikan, provinsi_id, districtId]);
        }
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating district');
    }
});

app.post('/delete-district/:id', isAuthenticated, async (req, res) => {
    const districtId = req.params.id;
    try {
        await pool.query('DELETE FROM kabupaten_tb WHERE id = $1', [districtId]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting district');
    }
});

// Authentication routes
app.get('/register', (req, res) => {
    res.render('auth/register');
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users_tb (username, email, password) VALUES ($1, $2, $3)', [username, email, hashedPassword]);
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error during registration');
    }
});

app.get('/login', (req, res) => {
    res.render('auth/login');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users_tb WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = user;
            res.redirect('/');
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error during login');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error during logout');
        }
        res.redirect('/login');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
