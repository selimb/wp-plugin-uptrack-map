FROM wordpress:latest

# Set up less (required by WP-CLI).
RUN apt-get update \
    && apt-get install less \
    && rm -rf /var/lib/apt/lists/*

# Install WP-CLI
RUN curl -fsSL https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar -o /usr/local/bin/wp \
    && chmod +x /usr/local/bin/wp \
    && mkdir -p /var/www/.wp-cli \
    && chown www-data:www-data /var/www/.wp-cli
