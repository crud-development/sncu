<?php
/**
 * Echipa — text + fotografie cu cadru SVG animat.
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$pills    = bsl_list( 'team_pills', bsl_list_default( 'team_pills' ) );
$team_img = bsl_img( 'team_image', bsl_default( 'team_image' ) );
?>
<section class="bsl-section" id="bsl-team">
	<div class="bsl-container bsl-team">
		<div class="bsl-team__visual" data-bsl-tilt>
			<span class="bsl-blob bsl-blob--team" aria-hidden="true"></span>
			<div class="bsl-team__photo">
				<img src="<?php echo esc_url( $team_img ); ?>" alt="Echipa BioEcoLab" loading="lazy" />
			</div>
			<svg class="bsl-team__orbit" viewBox="0 0 200 200" aria-hidden="true">
				<circle cx="100" cy="100" r="92" fill="none" stroke="rgba(22,101,52,.25)" stroke-width="1" stroke-dasharray="3 7" />
			</svg>
			<div class="bsl-team__seal" data-bsl-parallax="50">
				<?php echo bsl_icon( 'shield' ); ?>
				<span>20+ ani</span>
			</div>
		</div>
		<div class="bsl-team__col">
			<span class="bsl-eyebrow"><?php bsl_e( 'team_eyebrow' ); ?></span>
			<h2 class="bsl-h2"><?php bsl_e( 'team_title' ); ?></h2>
			<p class="bsl-lead"><?php bsl_e( 'team_text' ); ?></p>
			<ul class="bsl-pills">
				<?php foreach ( $pills as $pill ) : ?>
					<li class="bsl-pill"><?php echo bsl_icon( 'check' ); ?><?php echo esc_html( $pill['text'] ); ?></li>
				<?php endforeach; ?>
			</ul>
		</div>
	</div>
</section>
