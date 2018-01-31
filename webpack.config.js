var fs = require('fs');
var url = require('url');
var path = require('path');
var webpack = require('webpack');

var DEBUG = !process.argv.production;

var GLOBALS = {
	'process.env.NODE_ENV': DEBUG ? '"development"' : '"production"',
	'__DEV__': DEBUG
};

module.exports = {
	// Main entry directory and file
	entry: {
		app: [
			// 'webpack/hot/dev-server',
			path.join(__dirname, 'app', 'main.js')
		]
	},

	// Output directories and file
	output: {
		path: path.join(__dirname, 'dist'),
		filename: '[name].js',
		chunkFilename: '[name].chunk.js',
		publicPath: './dist/',
		almond: true,
		minify: true
	},

	// Custom plugins
	plugins: [
		new webpack.DefinePlugin(GLOBALS),
		new webpack.optimize.OccurenceOrderPlugin(),
		new webpack.optimize.UglifyJsPlugin({
 			compress: { warnings: false }		
 		})
	]
		.concat(DEBUG ? [
		new webpack.optimize.UglifyJsPlugin({
				compress: { warnings: false }
			})
		] : [
				new webpack.optimize.DedupePlugin(),
				new webpack.optimize.UglifyJsPlugin(),
				new webpack.optimize.AggressiveMergingPlugin()
			]),

	module: {
		loaders: [
			{
				include: /\.json$/,
				loaders: ['json-loader']
			},
			{ test: /\.html$/, loader: 'html' },
			// { test: /\.json$/, loader: 'json' },
			{
				test: /\.(jpe?g|png|gif|svg)$/i,
				loaders: [
					'file-loader?hash=sha512&digest=hex&name=[hash].[ext]',
					'image-webpack-loader?bypassOnDebug&optimizationLevel=7&interlaced=false'
				]
			},
			{
				test: /\.css$/,
				include: /node_modules/,
				loader: 'style!css'
			},
			{
				test: /\.scss/,
				exclude: /node_modules/,
				loader: 'style!css?modules&importLoaders=2&sourceMap&localIdentName=[local]___[hash:base64:5]!autoprefixer?browsers=last 2 version!sass?outputStyle=expanded&sourceMap&includePaths[]=node_modules/compass-mixins/lib'
			},
			{
				test: /\.css$/,
				loader: 'style-loader!css-loader'
			},
			{ test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' }
		]
	},

	resolve: {
		extensions: ['', '.js', '.jsx', '.json', 'scss', 'css'],

		modulesDirectories: [
			'node_modules',
			'app'
		],

		root: path.join(__dirname, 'app'),

		alias: {
			durandal: 'durandal/js',
			plugins: 'durandal/js/plugins'
		}
	},

	externals: {
		jquery: 'jQuery'
	},

	devServer: {
		contentBase: __dirname,
		hot: false,
		inline: true,
		historyApiFallback: true,
		stats: { colors: true },
		progress: true
	}
};
