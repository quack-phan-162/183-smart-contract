const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');

module.exports ={
    entry: './src/index.js', 
    output: {
        path: path.join(__dirname, '/dist'),
        filename: 'bundle.js'
    },
    plugins: [
        new HTMLWebpackPlugin({
            template: './src/index.html'
        })
    ],
    module: {
        rules: [
            {
                test: /.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        "presets": ["es2015", "stage-2", "stage-3"]
                    }
                }
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                loader: 'file-loader'
            }  
        ]
        
    }
}