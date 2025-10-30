<?php

/**
 * Leaflet_Map_Plugin_Option
 *
 * Store values; render widgets
 *
 * PHP Version 5.5
 *
 * @category Shortcode
 * @author   Benjamin J DeLong <ben@bozdoz.com>
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Leaflet_Map_Plugin_Option
 */
class Leaflet_Map_Plugin_Option
{
    /**
     * Default Value
     *
     * @var varies $default
     */
    public $default = '';

    /**
     * Input type ex: ('text', 'select', 'checkbox')
     *
     * @var string $type
     */
    public $type;

    /**
     * Optional used for select; maybe checkbox/radio
     *
     * @var array $options
     */
    public $options = array();

    /**
     * Optional used for label under input
     *
     * @var string $helptext
     */
    public $helptext = '';

    /**
     * All properties that we will be setting
     */
    public $display_name = '';
    public $min = 0;
    public $max = 0;
    public $step = 0;

    /**
     * Instantiate class
     *
     * @param array $details A list of options
     */
    function __construct($details = array())
    {
        if (!$details) {
            // just an empty db entry (for now)
            // nothing to store, nothing to render
            return;
        }

        $option_filter = array(
            'display_name'     =>     FILTER_SANITIZE_FULL_SPECIAL_CHARS,
            'default'          =>     null,
            'type'             =>     FILTER_SANITIZE_FULL_SPECIAL_CHARS,
            'min'              =>     "",
            'max'              =>     "",
            'step'             =>     "",
            'options'          =>     array(
                'filter' => FILTER_SANITIZE_FULL_SPECIAL_CHARS,
                'flags'  => FILTER_FORCE_ARRAY
            ),
            'helptext'         =>     null
        );

        // get matching keys only
        $details = array_intersect_key($details, $option_filter);

        // apply filter
        $details = filter_var_array($details, $option_filter);

        foreach ($details as $key => $value) {
            $this->$key = $value;
        }
    }

    /**
     * Renders a widget
     *
     * @param string $name  widget name
     * @param varies $value widget value
     * @param Leaflet_Map_Plugin_Settings $settings all settings
     *
     * @return HTML
     */
    function widget($name, $value, $settings)
    {
        switch ($this->type) {
            case 'text':
?>
                <input
                    class="full-width"
                    name="<?php echo $name; ?>"
                    type="<?php echo $this->type; ?>"
                    id="<?php echo $name; ?>"
                    value="<?php echo htmlspecialchars($value); ?>" />
            <?php
                break;


            case 'number':
            ?>
                <input
                    class="full-width"
                    min="<?php echo isset($this->min) ? $this->min : ""; ?>"
                    max="<?php echo isset($this->max) ? $this->max : ""; ?>"
                    step="<?php echo isset($this->step) ? $this->step : "any"; ?>"
                    name="<?php echo $name; ?>"
                    type="<?php echo $this->type; ?>"
                    id="<?php echo $name; ?>"
                    value="<?php echo htmlspecialchars($value); ?>" />
            <?php
                break;

            case 'textarea':
            ?>

                <textarea
                    id="<?php echo $name; ?>"
                    class="full-width"
                    name="<?php echo $name; ?>"><?php echo htmlspecialchars($value); ?></textarea>

            <?php
                break;

            case 'checkbox':
            ?>

                <input
                    class="checkbox"
                    name="<?php echo $name; ?>"
                    type="checkbox"
                    id="<?php echo $name; ?>"
                    <?php if ($value) echo ' checked="checked"' ?> />
            <?php
                break;

            case 'select':
            ?>
                <select id="<?php echo $name; ?>"
                    name="<?php echo $name; ?>"
                    class="full-width">
                    <?php
                    foreach ($this->options as $o => $n) {
                    ?>
                        <option value="<?php echo $o; ?>" <?php if ($value == $o) echo ' selected' ?>>
                            <?php echo $n; ?>
                        </option>
                    <?php
                    }
                    ?>
                </select>
            <?php
                break;

            case 'kml_map_table':
            ?>
                <table class="widefat fixed striped">
                    <thead>
                        <tr>
                            <th>KML File</th>
                            <th>Blog Post</th>
                            <th>Type</th>
                            <th>Distance (km)</th>
                            <th>Elevation (m)</th>
                            <th>Duration (days)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $kml_directory = $settings->get('uptrack_kml_directory');
                        if ($kml_directory) {
                            $full_path = WP_CONTENT_DIR . '/' . ltrim($kml_directory, '/');
                            // Get all published posts
                            $posts = get_posts(array(
                                'numberposts' => -1,
                                'post_type' => 'post'
                            ));
                            if (is_dir($full_path)) {
                                $files = glob($full_path . '/*.kml');
                                if ($files) {
                                    sort($files);
                                    foreach ($files as $file) {
                                        $filename = basename($file);
                                        $base_input_name = $name . '[' . htmlspecialchars($filename) . ']';

                                        $blog_post_input = $base_input_name . '[post_id]';
                                        $blog_post_value = $value[$filename]["post_id"] ?? '';

                                        $type_input = $base_input_name . '[type]';
                                        $type_value = $value[$filename]["type"] ?? 'ski_touring';

                                        $distance_input = $base_input_name . '[distance_km]';
                                        $distance_value = $value[$filename]["distance_km"] ?? "0";

                                        $elevation_input = $base_input_name . '[elevation_m]';
                                        $elevation_value = $value[$filename]["elevation_m"] ?? "0";

                                        $duration_input = $base_input_name . '[duration_d]';
                                        $duration_value = $value[$filename]["duration_d"] ?? "0";
                        ?>
                                        <tr>
                                            <td><?php echo htmlspecialchars($filename); ?></td>
                                            <td>
                                                <select name="<?php echo $blog_post_input; ?>" class="required">
                                                    <option value=""></option>
                                                    <?php
                                                    foreach ($posts as $post) {
                                                        $selected = $blog_post_value == $post->ID ? ' selected' : '';
                                                    ?>
                                                        <option value="<?php echo $post->ID; ?>" <?php echo $selected; ?>>
                                                            <?php echo htmlspecialchars($post->post_title); ?>
                                                        </option>
                                                    <?php
                                                    }
                                                    ?>
                                                </select>
                                            </td>
                                            <td>
                                                <select name="<?php echo $type_input; ?>">
                                                    <?php
                                                    foreach (["ski_touring", "mountaineering", "hiking"] as $type) {
                                                        $selected = $type_value == $type ? ' selected' : '';
                                                    ?>
                                                        <option value="<?php echo $type; ?>" <?php echo $selected; ?>>
                                                            <?php echo $type; ?>
                                                        </option>
                                                    <?php
                                                    }
                                                    ?>
                                                </select>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    name="<?php echo htmlspecialchars($distance_input); ?>"
                                                    value="<?php echo htmlspecialchars($distance_value); ?>" />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    name="<?php echo htmlspecialchars($elevation_input); ?>"
                                                    value="<?php echo htmlspecialchars($elevation_value); ?>" />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    name="<?php echo htmlspecialchars($duration_input); ?>"
                                                    value="<?php echo htmlspecialchars($duration_value); ?>" />
                                            </td>
                                        </tr>
                                    <?php
                                    }
                                } else {
                                    ?>
                                    <tr>
                                        <td colspan="2">No KML files found in: <?php echo htmlspecialchars($full_path); ?></td>
                                    </tr>
                                <?php
                                }
                            } else {
                                ?>
                                <tr>
                                    <td colspan="2">KML directory not found: <?php echo htmlspecialchars($full_path); ?></td>
                                </tr>
                            <?php
                            }
                        } else {
                            ?>
                            <tr>
                                <td colspan="2">KML directory not set</td>
                            </tr>
                        <?php
                        }
                        ?>
                    </tbody>
                </table>
            <?php
                break;
            default:
            ?>
                <div>No option type chosen for <?php echo $name; ?> with value <?php echo htmlspecialchars($value); ?></div>
<?php
                break;
        }
    }
}
