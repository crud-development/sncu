<?php
/**
 * Înregistrarea grupurilor de câmpuri ACF pentru landing page-ul SNCU.
 *
 * Câmpurile sunt definite în cod (acf_add_local_field_group) pornind de la
 * schema din config.php, deci sunt versionabile și apar automat în admin.
 * Listele (carduri) folosesc câmpul Repeater (ACF PRO).
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Construiește și înregistrează grupul de câmpuri ACF din schema de conținut.
 */
function bsl_register_acf_fields() {

	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	$schema = bsl_content_schema();
	$fields = array();

	foreach ( $schema as $section_key => $section ) {

		// Tab pentru secțiune.
		$fields[] = array(
			'key'       => 'field_bsl_tab_' . $section_key,
			'label'     => $section['label'],
			'type'      => 'tab',
			'placement' => 'left',
		);

		// Câmpuri scalare.
		if ( ! empty( $section['fields'] ) ) {
			foreach ( $section['fields'] as $name => $def ) {
				if ( 'image' === $def['type'] ) {
					$fields[] = array(
						'key'           => 'field_bsl_' . $name,
						'label'         => $def['label'],
						'name'          => $name,
						'type'          => 'image',
						'return_format' => 'url',
						'preview_size'  => 'medium',
						'instructions'  => 'Lasă gol pentru imaginea implicită.',
					);
					continue;
				}
				$fields[] = array(
					'key'           => 'field_bsl_' . $name,
					'label'         => $def['label'],
					'name'          => $name,
					'type'          => 'textarea' === $def['type'] ? 'textarea' : ( 'url' === $def['type'] ? 'url' : 'text' ),
					'default_value' => isset( $def['default'] ) ? $def['default'] : '',
					'rows'          => 'textarea' === $def['type'] ? 3 : null,
				);
			}
		}

		// Liste — câmpuri Group numerotate (compatibil ACF free, fără Repeater).
		if ( ! empty( $section['lists'] ) ) {
			foreach ( $section['lists'] as $list_name => $list ) {
				$defaults = isset( $list['default'] ) ? array_values( $list['default'] ) : array();
				$max      = count( $defaults ) + BSL_LIST_BUFFER;

				// Separator vizual cu numele listei.
				$fields[] = array(
					'key'     => 'field_bsl_msg_' . $list_name,
					'label'   => $list['label'],
					'type'    => 'message',
					'message' => 'Completează elementele de mai jos. Lasă un element complet gol pentru a-l ascunde din pagină.',
				);

				for ( $i = 1; $i <= $max; $i++ ) {
					$sub_fields = array();
					foreach ( $list['fields'] as $sub_name => $sub_label ) {
						if ( 'image' === $sub_name ) {
							$sub_fields[] = array(
								'key'           => 'field_bsl_' . $list_name . '_' . $i . '_' . $sub_name,
								'label'         => $sub_label,
								'name'          => $sub_name,
								'type'          => 'image',
								'return_format' => 'url',
								'preview_size'  => 'thumbnail',
								'wrapper'       => array( 'width' => 100 ),
							);
							continue;
						}
						$is_long      = in_array( $sub_name, array( 'text', 'quote' ), true );
						$default      = isset( $defaults[ $i - 1 ][ $sub_name ] ) ? $defaults[ $i - 1 ][ $sub_name ] : '';
						$sub_fields[] = array(
							'key'           => 'field_bsl_' . $list_name . '_' . $i . '_' . $sub_name,
							'label'         => $sub_label,
							'name'          => $sub_name,
							'type'          => $is_long ? 'textarea' : 'text',
							'rows'          => $is_long ? 3 : null,
							'default_value' => $default,
							'wrapper'       => array( 'width' => $is_long ? 100 : 50 ),
						);
					}

					$fields[] = array(
						'key'        => 'field_bsl_' . $list_name . '_' . $i,
						'label'      => $list['label'] . ' — #' . $i,
						'name'       => $list_name . '_' . $i,
						'type'       => 'group',
						'layout'     => 'block',
						'sub_fields' => $sub_fields,
					);
				}
			}
		}
	}

	acf_add_local_field_group(
		array(
			'key'                   => 'group_bsl_landing',
			'title'                 => 'Conținut Landing SNCU',
			'fields'                => $fields,
			'location'              => array(
				array(
					array(
						'param'    => 'page_template',
						'operator' => '==',
						'value'    => 'template-sncu-landing.php',
					),
				),
			),
			'menu_order'            => 0,
			'position'              => 'normal',
			'style'                 => 'default',
			'label_placement'       => 'top',
			'instruction_placement' => 'label',
			'active'                => true,
			'description'           => 'Toate textele paginii de colectare SNCU. Lasă gol pentru a folosi textul implicit.',
		)
	);
}
add_action( 'acf/init', 'bsl_register_acf_fields' );
