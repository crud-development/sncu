<?php
/**
 * Hero — layout editorial cu imagine, mesh animat, blob-uri și ticker.
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$trust     = bsl_list( 'hero_trust', bsl_list_default( 'hero_trust' ) );
$hero_img  = bsl_img( 'hero_image', bsl_default( 'hero_image' ) );
$stats     = bsl_list( 'stats_items', bsl_list_default( 'stats_items' ) );
?>
<section class="bsl-hero">
	<div class="bsl-hero__mesh" aria-hidden="true"></div>
	<span class="bsl-blob bsl-blob--1" aria-hidden="true"></span>
	<span class="bsl-blob bsl-blob--2" aria-hidden="true"></span>
	<span class="bsl-grid-lines" aria-hidden="true"></span>

	<div class="bsl-container bsl-hero__grid">
		<div class="bsl-hero__content">
			<span class="bsl-badge"><span class="bsl-badge__dot"></span><?php bsl_e( 'hero_badge' ); ?></span>
			<h1 class="bsl-hero__title"><?php bsl_e( 'hero_title' ); ?></h1>
			<p class="bsl-hero__subtitle"><?php bsl_e( 'hero_subtitle' ); ?></p>
			<p class="bsl-hero__tagline"><span class="bsl-mark"><?php bsl_e( 'hero_tagline' ); ?></span></p>
			<p class="bsl-hero__desc"><?php bsl_e( 'hero_desc' ); ?></p>

			<div class="bsl-hero__cta">
				<a class="bsl-btn bsl-btn--primary bsl-btn--lg" data-bsl-magnetic href="<?php echo esc_url( $app_url ); ?>">
					<?php bsl_e( 'hero_cta_1' ); ?><?php echo bsl_icon( 'arrow' ); ?>
				</a>
				<a class="bsl-btn bsl-btn--ghost bsl-btn--lg" href="#bsl-advantages"><?php bsl_e( 'hero_cta_2' ); ?></a>
			</div>

			<ul class="bsl-hero__trust">
				<?php foreach ( $trust as $item ) : ?>
					<li><?php echo bsl_icon( 'check' ); ?><span><?php echo esc_html( $item['text'] ); ?></span></li>
				<?php endforeach; ?>
			</ul>
		</div>

		<div class="bsl-hero__media" data-bsl-tilt>
			<div class="bsl-hero__frame">
				<img src="<?php echo esc_url( $hero_img ); ?>" alt="Gestionare SNCU BioEcoLab" loading="eager" />
				<span class="bsl-hero__scan" aria-hidden="true"></span>
			</div>

			<!-- Inel SVG animat -->
			<svg class="bsl-hero__ring" viewBox="0 0 120 120" aria-hidden="true">
				<circle cx="60" cy="60" r="54" fill="none" stroke="rgba(22,101,52,.28)" stroke-width="1" stroke-dasharray="4 6" />
				<circle class="bsl-hero__ring-dot" cx="60" cy="6" r="4" fill="#16a34a" />
			</svg>

			<?php if ( ! empty( $stats[0] ) ) : ?>
			<div class="bsl-hero__chip bsl-hero__chip--a" data-bsl-parallax="40">
				<strong><?php echo esc_html( $stats[0]['value'] ); ?></strong>
				<span><?php echo esc_html( $stats[0]['text'] ); ?></span>
			</div>
			<?php endif; ?>
			<?php if ( ! empty( $stats[2] ) ) : ?>
			<div class="bsl-hero__chip bsl-hero__chip--b" data-bsl-parallax="60">
				<span class="bsl-hero__chip-ico"><?php echo bsl_icon( 'calendar' ); ?></span>
				<div><strong><?php echo esc_html( $stats[2]['value'] ); ?></strong><span><?php echo esc_html( $stats[2]['text'] ); ?></span></div>
			</div>
			<?php endif; ?>
		</div>
	</div>

	<!-- Ticker -->
	<div class="bsl-ticker" aria-hidden="true">
		<div class="bsl-ticker__track">
			<?php for ( $r = 0; $r < 2; $r++ ) : ?>
				<?php foreach ( $trust as $item ) : ?>
					<span class="bsl-ticker__item"><?php echo bsl_icon( 'spark' ); ?><?php echo esc_html( $item['text'] ); ?></span>
				<?php endforeach; ?>
				<span class="bsl-ticker__item"><?php echo bsl_icon( 'spark' ); ?>Reg. CE 1069/2009</span>
				<span class="bsl-ticker__item"><?php echo bsl_icon( 'spark' ); ?>Autorizat ANSVSA</span>
			<?php endfor; ?>
		</div>
	</div>

	<?php echo bsl_wave(); ?>
</section>
