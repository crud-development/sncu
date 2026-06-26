<?php
/**
 * Schema de conținut a landing page-ului SNCU.
 *
 * Sursă unică de adevăr: alimentează atât default-urile câmpurilor ACF
 * (includes/acf-fields.php) cât și randarea template-ului (templates/...).
 *
 * Fiecare valoare definită aici este textul implicit din analiza de produs.
 * Editarea reală se face din admin (ACF); aceste valori sunt doar fallback.
 *
 * @package Bioecolab_SNCU_Landing
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Returnează schema completă de conținut, organizată pe secțiuni.
 *
 * @return array
 */
function bsl_content_schema() {
	return array(

		'general' => array(
			'label'  => 'General',
			'fields' => array(
				'brand_name'    => array( 'label' => 'Nume brand', 'type' => 'text', 'default' => 'BIOECOLAB' ),
				'brand_logo'    => array( 'label' => 'Logo (gol = logo-ul implicit din plugin)', 'type' => 'image', 'default' => '' ),
				'app_base_url'  => array( 'label' => 'URL aplicație (bază). Gol = același domeniu. Ex: https://app.bioecolab.ro', 'type' => 'url', 'default' => '' ),
				'register_path' => array( 'label' => 'Cale înregistrare + plată', 'type' => 'text', 'default' => '/app/inregistrare' ),
				'login_path'    => array( 'label' => 'Cale autentificare', 'type' => 'text', 'default' => '/app/login' ),
				'nav_login'     => array( 'label' => 'Etichetă „Autentificare”', 'type' => 'text', 'default' => 'Autentificare' ),
				'nav_cta'       => array( 'label' => 'Etichetă „Generează contract”', 'type' => 'text', 'default' => 'Generează contract' ),
			),
		),

		'hero' => array(
			'label'  => 'Hero',
			'fields' => array(
				'hero_badge'    => array( 'label' => 'Badge', 'type' => 'text', 'default' => 'Operator autorizat ANSVSA · Conform Reg. CE 1069/2009' ),
				'hero_title'    => array( 'label' => 'Titlu H1', 'type' => 'text', 'default' => 'Contract de neutralizare a subproduselor de origine animală ce nu sunt destinate consumului uman (SNCU)' ),
				'hero_subtitle' => array( 'label' => 'Subtitlu', 'type' => 'text', 'default' => 'Preluăm și gestionăm legal Categoria 1, 2 și 3.' ),
				'hero_tagline'  => array( 'label' => 'Tagline', 'type' => 'text', 'default' => 'Te scăpăm de grija conformării.' ),
				'hero_desc'     => array( 'label' => 'Descriere', 'type' => 'textarea', 'default' => '100% online — contract generat, semnat și valabil în câteva minute.' ),
				'hero_cta_1'    => array( 'label' => 'Buton CTA principal', 'type' => 'text', 'default' => 'Generează contract acum' ),
				'hero_cta_2'    => array( 'label' => 'Buton CTA secundar', 'type' => 'text', 'default' => 'Descoperă avantajele' ),
				'hero_image'    => array( 'label' => 'Imagine hero', 'type' => 'image', 'default' => 'https://images.unsplash.com/photo-1651525670114-2b8117390b28?auto=format&fit=crop&w=1100&q=80' ),
			),
			'lists' => array(
				'hero_trust' => array(
					'label'  => 'Trust indicators',
					'fields' => array( 'text' => 'Text' ),
					'default' => array(
						array( 'text' => 'Acoperire națională' ),
						array( 'text' => 'Intervenție în 48-72h' ),
						array( 'text' => 'Semnătură electronică' ),
						array( 'text' => 'Fără deplasări sau printări' ),
					),
				),
			),
		),

		'stats' => array(
			'label' => 'Bandă statistici',
			'lists' => array(
				'stats_items' => array(
					'label'  => 'Statistici',
					'fields' => array( 'value' => 'Valoare', 'text' => 'Descriere' ),
					'default' => array(
						array( 'value' => '300+', 'text' => 'clienți activi din industria alimentară' ),
						array( 'value' => '20', 'text' => 'ani experiență în gestionarea SNCU' ),
						array( 'value' => '72h', 'text' => 'timp maxim de intervenție garantat' ),
						array( 'value' => '100%', 'text' => 'acoperire națională, toate județele' ),
					),
				),
			),
		),

		'industries' => array(
			'label'  => 'Industriile vizate',
			'fields' => array(
				'industries_eyebrow'  => array( 'label' => 'Titlu secțiune', 'type' => 'text', 'default' => 'Cui ne adresăm' ),
				'industries_title'    => array( 'label' => 'Subtitlu H2', 'type' => 'text', 'default' => 'Industrii pe care le servim' ),
				'industries_desc'     => array( 'label' => 'Descriere', 'type' => 'textarea', 'default' => 'Dacă activitatea ta implică prelucrarea, prepararea sau comercializarea produselor de origine animală, ești obligat legal să gestionezi SNCU cu un operator autorizat.' ),
			),
			'lists' => array(
				'industries_items' => array(
					'label'  => 'Carduri industrii',
					'fields' => array( 'icon' => 'Icon (slug)', 'title' => 'Titlu', 'text' => 'Descriere', 'image' => 'Imagine' ),
					'default' => array(
						array( 'icon' => 'abator', 'title' => 'Abatoare', 'text' => 'Tăiere bovine, porcine, ovine, păsări', 'image' => 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=700&q=80' ),
						array( 'icon' => 'carmangerie', 'title' => 'Carmangerii', 'text' => 'Procesare și tranșare carne', 'image' => 'https://images.unsplash.com/photo-1606677661991-446cea8ee182?auto=format&fit=crop&w=700&q=80' ),
						array( 'icon' => 'restaurant', 'title' => 'Restaurante', 'text' => 'HoReCa, cantine, catering', 'image' => 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=700&q=80' ),
						array( 'icon' => 'magazin', 'title' => 'Magazine', 'text' => 'Raioane carne, mezeluri, pește', 'image' => 'https://images.unsplash.com/photo-1597417321971-45e034f7a993?auto=format&fit=crop&w=700&q=80' ),
						array( 'icon' => 'ferma', 'title' => 'Ferme', 'text' => 'Creștere animale, avicultură', 'image' => 'https://images.unsplash.com/photo-1588152850700-c82ecb8ba9b1?auto=format&fit=crop&w=700&q=80' ),
						array( 'icon' => 'peste', 'title' => 'Procesare pește', 'text' => 'Fabrici, unități de afumare', 'image' => 'https://images.unsplash.com/photo-1507991426709-5bbee2c6a189?auto=format&fit=crop&w=700&q=80' ),
						array( 'icon' => 'lactate', 'title' => 'Lactate', 'text' => 'Procesare lapte, brânzeturi', 'image' => 'https://images.unsplash.com/photo-1636998980792-63f27ddea4e3?auto=format&fit=crop&w=700&q=80' ),
						array( 'icon' => 'oua', 'title' => 'Ouă și avicultură', 'text' => 'Selecție, ambalare, procesare', 'image' => 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=700&q=80' ),
					),
				),
			),
		),

		'categories' => array(
			'label'  => 'Categoriile SNCU',
			'fields' => array(
				'categories_eyebrow' => array( 'label' => 'Titlu secțiune', 'type' => 'text', 'default' => 'Ce gestionăm' ),
				'categories_title'   => array( 'label' => 'Subtitlu H2', 'type' => 'text', 'default' => 'Categoriile 1, 2 și 3 de SNCU' ),
				'categories_desc'    => array( 'label' => 'Descriere', 'type' => 'textarea', 'default' => 'Regulamentul CE 1069/2009 clasifică subprodusele de origine animală în trei categorii în funcție de riscul sanitar. Le preluăm pe toate.' ),
			),
			'lists' => array(
				'categories_items' => array(
					'label'  => 'Carduri categorii',
					'fields' => array( 'tag' => 'Etichetă risc', 'title' => 'Titlu', 'text' => 'Descriere' ),
					'default' => array(
						array( 'tag' => 'Risc înalt', 'title' => 'Categoria 1', 'text' => 'Material cu risc maxim. Animale suspecte de boli transmisibile, material specific de risc (MSR), deșeuri de la frontieră, animale de companie, animale de laborator.' ),
						array( 'tag' => 'Risc mediu', 'title' => 'Categoria 2', 'text' => 'Material neadecvat consumului. Gunoi de grajd, conținut digestiv, animale moarte neviolent, produse cu reziduuri de medicamente, produse retrase sau respinse.' ),
						array( 'tag' => 'Risc scăzut', 'title' => 'Categoria 3', 'text' => 'Subproduse din producție alimentară. Resturi de la abatoare aprobate, produse lactate, subproduse din industria peștelui, ouă și subproduse din ouă neadecvate consumului.' ),
					),
				),
			),
		),

		'risks' => array(
			'label'  => 'Riscuri de neconformare',
			'fields' => array(
				'risks_eyebrow' => array( 'label' => 'Titlu secțiune', 'type' => 'text', 'default' => 'Riscuri de neconformare' ),
				'risks_title'   => array( 'label' => 'Subtitlu H2', 'type' => 'text', 'default' => 'Ce riști fără un contract legal' ),
				'risks_desc'    => array( 'label' => 'Descriere', 'type' => 'textarea', 'default' => 'Nerespectarea obligațiilor privind gestionarea SNCU atrage consecințe severe, inclusiv suspendarea autorizațiilor de funcționare.' ),
				'risks_cta_text' => array( 'label' => 'Text CTA', 'type' => 'text', 'default' => 'Nu risca. Un contract cadru te protejează complet — 330 lei / an + TVA.' ),
				'risks_cta_btn'  => array( 'label' => 'Buton CTA', 'type' => 'text', 'default' => 'Generează contractul acum' ),
			),
			'lists' => array(
				'risks_items' => array(
					'label'  => 'Carduri riscuri',
					'fields' => array( 'title' => 'Titlu', 'text' => 'Descriere' ),
					'default' => array(
						array( 'title' => 'Amenzi contravenționale', 'text' => 'Sancțiuni între 5.000 și 30.000 lei per constatare, aplicate de ANSVSA în urma controalelor de rutină sau sesizărilor.' ),
						array( 'title' => 'Suspendarea activității', 'text' => 'Autoritățile pot suspenda autorizația sanitar-veterinară dacă nu există contract valabil cu un operator autorizat de preluare SNCU.' ),
						array( 'title' => 'Răspundere penală', 'text' => 'Abandonarea sau eliminarea neautorizată a SNCU poate constitui infracțiune de mediu conform Codului Penal.' ),
						array( 'title' => 'Pierderea certificărilor', 'text' => 'Lipsa conformității SNCU blochează obținerea sau reînnoirea autorizațiilor IFS, BRC, ISO 22000 și a altor standarde de calitate alimentară.' ),
						array( 'title' => 'Probleme la inspecții UE', 'text' => 'Exportatorii care nu pot dovedi gestionarea conformă a SNCU riscă pierderea dreptului de export pe piața Uniunii Europene.' ),
						array( 'title' => 'Riscuri sanitare și de mediu', 'text' => 'Depozitarea necorespunzătoare poate genera focare de boli, infestări cu dăunători și poluarea solului sau apelor freatice.' ),
					),
				),
			),
		),

		'advantages' => array(
			'label'  => 'Avantajele colaborării',
			'fields' => array(
				'advantages_eyebrow' => array( 'label' => 'Titlu secțiune', 'type' => 'text', 'default' => 'De ce noi' ),
				'advantages_title'   => array( 'label' => 'Subtitlu H2', 'type' => 'text', 'default' => 'Avantajele colaborării cu BioEcoLab' ),
			),
			'lists' => array(
				'advantages_items' => array(
					'label'  => 'Carduri avantaje',
					'fields' => array( 'icon' => 'Icon (slug)', 'title' => 'Titlu', 'text' => 'Descriere' ),
					'default' => array(
						array( 'icon' => 'map', 'title' => 'Acoperire națională', 'text' => 'Operăm în toate județele României. Indiferent unde ești, ajungem la tine în 48-72 ore de la comandă.' ),
						array( 'icon' => 'experience', 'title' => '20 de ani de experiență', 'text' => 'Echipă de specialiști cu două decenii de practică în gestionarea legală și sigură a subproduselor de origine animală.' ),
						array( 'icon' => 'clients', 'title' => '300+ clienți mulțumiți', 'text' => 'Colaborăm cu abatoare, restaurante, ferme și magazine din toată țara. Suntem partenerul de încredere al industriei alimentare.' ),
						array( 'icon' => 'shield', 'title' => 'Conformitate garantată', 'text' => 'Autorizat ANSVSA, conform Reg. CE 1069/2009. Documentele de transport și de predare sunt emise corect la fiecare ridicare.' ),
						array( 'icon' => 'calendar', 'title' => 'Ridicări la cerere online', 'text' => 'Programezi ridicarea direct din portal, fără apeluri telefonice. Confirmarea vine în câteva minute.' ),
						array( 'icon' => 'document', 'title' => 'Contract 100% online', 'text' => 'Generezi, semnezi electronic și arhivezi contractul fără nicio deplasare. Totul este valabil legal din prima zi.' ),
					),
				),
			),
		),

		'team' => array(
			'label'  => 'Echipa',
			'fields' => array(
				'team_eyebrow' => array( 'label' => 'Titlu secțiune', 'type' => 'text', 'default' => 'Echipa noastră' ),
				'team_title'   => array( 'label' => 'Subtitlu H2', 'type' => 'text', 'default' => 'Profesioniști cu 20 de ani în industrie' ),
				'team_text'    => array( 'label' => 'Text', 'type' => 'textarea', 'default' => 'Echipa noastră include medici veterinari autorizați, specialiști în biosecuritate și logisticieni cu experiență în transportul reglementat al subproduselor de origine animală. Cu peste 20 de ani de activitate, am dezvoltat proceduri clare, vehicule specializate și o rețea națională de procesare conformă cu legislația europeană.' ),
				'team_image'   => array( 'label' => 'Imagine echipă', 'type' => 'image', 'default' => 'https://images.unsplash.com/photo-1596272875729-ed2ff7d6d9c5?auto=format&fit=crop&w=900&q=80' ),
			),
			'lists' => array(
				'team_pills' => array(
					'label'  => 'Competențe (pills)',
					'fields' => array( 'text' => 'Text' ),
					'default' => array(
						array( 'text' => 'Medici veterinari autorizați' ),
						array( 'text' => 'Specialiști biosecuritate' ),
						array( 'text' => 'Logistică specializată' ),
						array( 'text' => 'Conformitate CE 1069/2009' ),
						array( 'text' => 'Transport autorizat ADR' ),
					),
				),
			),
		),

		'testimonials' => array(
			'label'  => 'Testimoniale',
			'fields' => array(
				'testimonials_eyebrow' => array( 'label' => 'Titlu secțiune', 'type' => 'text', 'default' => 'Ce spun clienții' ),
				'testimonials_title'   => array( 'label' => 'Subtitlu H2', 'type' => 'text', 'default' => '300+ business-uri ne-au ales' ),
			),
			'lists' => array(
				'testimonials_items' => array(
					'label'  => 'Testimoniale',
					'fields' => array( 'quote' => 'Citat', 'author' => 'Autor', 'role' => 'Funcție / locație' ),
					'default' => array(
						array( 'quote' => 'Colaborăm cu BIOECOLAB de peste 3 ani. De când am trecut pe platforma lor online, tot procesul de predare SNCU durează câteva minute — de la comandă până la documentele de transport. La ultimul control ANSVSA, inspectorul a verificat contractul și istoricul ridicărilor și nu a avut nicio obiecție. Exact ce ne trebuia: simplu, rapid și 100% conform.', 'author' => 'Mihai P.', 'role' => 'Abator, Cluj' ),
						array( 'quote' => 'Ca proprietar de restaurant, conformarea cu legislația SNCU era o bătaie de cap pe care o tot amânam. De când am semnat contractul — online, în 10 minute — nu m-am mai gândit la subiect. Comand ridicarea din telefon, vin la timp, îmi lasă documentele în regulă. La controlul de la DSVSA din martie nu am avut nicio problemă. Recomand oricui din HoReCa.', 'author' => 'Cristina B.', 'role' => 'Administrator restaurant, București' ),
						array( 'quote' => 'Am trecut la BIOECOLAB după ce am fost amendați de ANSVSA pentru documente incomplete la un alt operator. De atunci, zero probleme. Contractul l-am generat și semnat online în aceeași zi. Documentele de la fiecare ridicare sunt corecte și le am arhivate în platformă oricând am nevoie de ele. Dacă ar fi existat această soluție mai devreme, evitam amenda de 8.000 de lei.', 'author' => 'Florin R.', 'role' => 'Carmangerie, Covasna' ),
						array( 'quote' => 'Sunt la al doilea an de contract și nu am avut niciodată o problemă. Platforma este simplă, nu ai nevoie de instruire ca să o folosești. Comenzi, istoricul ridicărilor, contractul — toate sunt acolo, la un click distanță. Iar când am avut un control inopinat, am deschis laptopul și am arătat inspectorului tot istoricul în 2 minute. Asta înseamnă un partener serios.', 'author' => 'Simona L.', 'role' => 'Manager supermarket, Timișoara' ),
					),
				),
			),
		),

		'obligations' => array(
			'label'  => 'Obligațiile clientului',
			'fields' => array(
				'obligations_eyebrow' => array( 'label' => 'Titlu secțiune', 'type' => 'text', 'default' => 'Obligații legale' ),
				'obligations_title'   => array( 'label' => 'Subtitlu H2', 'type' => 'text', 'default' => 'Ce trebuie să faci ca generator SNCU' ),
			),
			'lists' => array(
				'obligations_items' => array(
					'label'  => 'Listă obligații',
					'fields' => array( 'text' => 'Text' ),
					'default' => array(
						array( 'text' => 'Colectezi și depozitezi SNCU în recipiente etanșe, etichetate, în spații refrigerate când este necesar.' ),
						array( 'text' => 'Soliciți ridicarea cu frecvența necesară pentru a nu depăși termenele legale de depozitare.' ),
						array( 'text' => 'Pui la dispoziție documentele de însoțire completate la fiecare predare.' ),
						array( 'text' => 'Asiguri accesul vehiculului autorizat la punctul de lucru declarat.' ),
						array( 'text' => 'Arhivezi documentele de predare minimum 2 ani la dispoziția autorităților veterinare.' ),
					),
				),
			),
		),

		'pricing' => array(
			'label'  => 'Preț',
			'fields' => array(
				'pricing_eyebrow'  => array( 'label' => 'Titlu secțiune', 'type' => 'text', 'default' => 'Tarif' ),
				'pricing_title'    => array( 'label' => 'Subtitlu H2', 'type' => 'text', 'default' => 'Un preț clar, fără surprize' ),
				'pricing_type'     => array( 'label' => 'Tip contract', 'type' => 'text', 'default' => 'Contract cadru anual' ),
				'pricing_price'    => array( 'label' => 'Preț', 'type' => 'text', 'default' => '330 Lei + TVA / an' ),
				'pricing_note'     => array( 'label' => 'Notă importantă', 'type' => 'textarea', 'default' => 'Fiecare preluare efectivă de SNCU se tarifează distinct în funcție de tip, categorie și cantitate. Tariful este comunicat la confirmarea fiecărei comenzi.' ),
				'pricing_btn'      => array( 'label' => 'Buton', 'type' => 'text', 'default' => 'Generează contractul meu' ),
			),
			'lists' => array(
				'pricing_includes' => array(
					'label'  => 'Include',
					'fields' => array( 'text' => 'Text' ),
					'default' => array(
						array( 'text' => 'Acces la platforma online' ),
						array( 'text' => 'Contract electronic generat automat' ),
						array( 'text' => 'Semnătură electronică inclusă' ),
						array( 'text' => 'Notificări automate' ),
						array( 'text' => '3 puncte de lucru incluse' ),
						array( 'text' => 'Arhivă digitală documente' ),
					),
				),
			),
		),

		'process' => array(
			'label'  => 'Pașii procesului',
			'fields' => array(
				'process_eyebrow' => array( 'label' => 'Titlu secțiune', 'type' => 'text', 'default' => 'Proces' ),
				'process_title'   => array( 'label' => 'Subtitlu H2', 'type' => 'text', 'default' => 'Cum funcționează în 6 pași' ),
			),
			'lists' => array(
				'process_steps' => array(
					'label'  => 'Pași',
					'fields' => array( 'title' => 'Titlu', 'text' => 'Descriere' ),
					'default' => array(
						array( 'title' => 'Completezi datele firmei', 'text' => 'Denumire, CUI, tip activitate, date de contact.' ),
						array( 'title' => 'Plătești contractul cadru', 'text' => '330 lei + TVA / an, prin card bancar. Confirmare instantă.' ),
						array( 'title' => 'Setezi parola și intri în cont', 'text' => 'Primești email cu link de activare și îți setezi parola.' ),
						array( 'title' => 'Configurezi punctul de lucru', 'text' => 'Adaugi adresa și tipul activității.' ),
						array( 'title' => 'Generezi și semnezi contractul', 'text' => 'Contractul se populează automat. Semnezi electronic direct din browser.' ),
						array( 'title' => 'Comandă ridicări la nevoie', 'text' => 'Oricând ai SNCU de predat, faci o comandă din portal și ajungem în 48-72h.' ),
					),
				),
			),
		),

		'footer_cta' => array(
			'label'  => 'Footer CTA',
			'fields' => array(
				'footer_title' => array( 'label' => 'Titlu H2', 'type' => 'text', 'default' => 'Ești conform din ziua în care semnezi' ),
				'footer_text'  => array( 'label' => 'Text', 'type' => 'textarea', 'default' => 'Peste 300 de business-uri din industria alimentară ne-au ales. Alătură-te și tu.' ),
				'footer_btn'   => array( 'label' => 'Buton', 'type' => 'text', 'default' => 'Generează contractul tău — 330 lei + TVA / an' ),
			),
		),

	);
}

/**
 * Returnează valoarea unui câmp: din ACF dacă există, altfel default din schemă.
 *
 * @param string $name    Numele câmpului ACF.
 * @param mixed  $default Valoare implicită.
 * @return mixed
 */
function bsl_field( $name, $default = '' ) {
	if ( function_exists( 'get_field' ) ) {
		$value = get_field( $name );
		if ( null !== $value && '' !== $value && array() !== $value ) {
			return $value;
		}
	}
	return $default;
}

/**
 * URL-ul logo-ului brandului: din ACF dacă e setat, altfel logo-ul livrat în plugin.
 *
 * @return string
 */
function bsl_logo() {
	$default = defined( 'BSL_URL' ) ? BSL_URL . 'assets/img/bioecolab-logo.png' : '';
	return bsl_img( 'brand_logo', $default );
}

/**
 * Construiește URL-ul unei pagini din aplicație (înregistrare/plată sau login).
 *
 * Combină URL-ul de bază al aplicației cu calea configurată. Dacă baza e goală,
 * rezultă o cale relativă (același domeniu). Dacă o cale este deja un URL absolut,
 * este folosită ca atare.
 *
 * @param string $which 'register' (înregistrare + plată) sau 'login'.
 * @return string
 */
function bsl_app_url( $which = 'register' ) {
	$base = rtrim( bsl_field( 'app_base_url', bsl_default( 'app_base_url' ) ), '/' );
	$path = 'login' === $which
		? bsl_field( 'login_path', bsl_default( 'login_path' ) )
		: bsl_field( 'register_path', bsl_default( 'register_path' ) );

	if ( 0 === stripos( $path, 'http://' ) || 0 === stripos( $path, 'https://' ) ) {
		return $path;
	}
	if ( '' === $base ) {
		return '/' . ltrim( $path, '/' );
	}
	return $base . '/' . ltrim( $path, '/' );
}

/**
 * Returnează URL-ul unei imagini ACF (return_format url) cu fallback la default.
 *
 * @param string $name    Numele câmpului imagine.
 * @param string $default URL implicit.
 * @return string
 */
function bsl_img( $name, $default = '' ) {
	if ( function_exists( 'get_field' ) ) {
		$v = get_field( $name );
		if ( is_array( $v ) ) {
			$v = isset( $v['url'] ) ? $v['url'] : '';
		}
		if ( $v ) {
			return $v;
		}
	}
	return $default;
}

/**
 * Imagine implicită pentru un card de industrie, după slug-ul iconiței.
 *
 * @param string $slug Slug.
 * @return string
 */
function bsl_industry_image( $slug ) {
	$map = array(
		'abator'      => 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=700&q=80',
		'carmangerie' => 'https://images.unsplash.com/photo-1606677661991-446cea8ee182?auto=format&fit=crop&w=700&q=80',
		'restaurant'  => 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=700&q=80',
		'magazin'     => 'https://images.unsplash.com/photo-1597417321971-45e034f7a993?auto=format&fit=crop&w=700&q=80',
		'ferma'       => 'https://images.unsplash.com/photo-1588152850700-c82ecb8ba9b1?auto=format&fit=crop&w=700&q=80',
		'peste'       => 'https://images.unsplash.com/photo-1507991426709-5bbee2c6a189?auto=format&fit=crop&w=700&q=80',
		'lactate'     => 'https://images.unsplash.com/photo-1636998980792-63f27ddea4e3?auto=format&fit=crop&w=700&q=80',
		'oua'         => 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=700&q=80',
	);
	return isset( $map[ $slug ] ) ? $map[ $slug ] : $map['restaurant'];
}

/**
 * Numărul de sloturi-tampon adăugate peste elementele implicite ale unei liste,
 * pentru a permite adăugarea de elemente noi din admin (ACF free, fără Repeater).
 */
if ( ! defined( 'BSL_LIST_BUFFER' ) ) {
	define( 'BSL_LIST_BUFFER', 2 );
}

/**
 * Returnează definiția (schema) unei liste după nume.
 *
 * @param string $name Numele listei.
 * @return array|null
 */
function bsl_list_schema( $name ) {
	foreach ( bsl_content_schema() as $section ) {
		if ( isset( $section['lists'][ $name ] ) ) {
			return $section['lists'][ $name ];
		}
	}
	return null;
}

/**
 * Numărul maxim de sloturi pentru o listă (elemente implicite + tampon).
 *
 * @param string $name Numele listei.
 * @return int
 */
function bsl_list_max( $name ) {
	$schema = bsl_list_schema( $name );
	$count  = ( $schema && ! empty( $schema['default'] ) ) ? count( $schema['default'] ) : 0;
	return $count + BSL_LIST_BUFFER;
}

/**
 * Returnează rândurile unei liste, asamblate din câmpurile ACF Group numerotate
 * (`{name}_{i}`), cu fallback la default-urile din schemă dacă ACF e gol/absent.
 *
 * @param string $name    Numele listei.
 * @param array  $default Rânduri implicite.
 * @return array
 */
function bsl_list( $name, $default = array() ) {
	if ( ! function_exists( 'get_field' ) ) {
		return $default;
	}

	$schema = bsl_list_schema( $name );
	if ( ! $schema ) {
		return $default;
	}

	$sub_keys = array_keys( $schema['fields'] );
	$rows     = array();
	$max      = bsl_list_max( $name );

	for ( $i = 1; $i <= $max; $i++ ) {
		$group = get_field( $name . '_' . $i );
		if ( ! is_array( $group ) ) {
			continue;
		}
		$row     = array();
		$has_any = false;
		foreach ( $sub_keys as $key ) {
			$val          = isset( $group[ $key ] ) ? $group[ $key ] : '';
			$row[ $key ]  = $val;
			$has_any      = $has_any || ( '' !== trim( (string) $val ) );
		}
		if ( $has_any ) {
			$rows[] = $row;
		}
	}

	return ! empty( $rows ) ? $rows : $default;
}

/**
 * Escape + echo cu fallback la default-ul din schemă, pe baza numelui de câmp.
 * Folosit pentru a scrie mai compact în template.
 *
 * @param string $name Numele câmpului.
 * @param string $tag  'text' (esc_html) sau 'attr' (esc_attr) sau 'url'.
 */
function bsl_e( $name, $tag = 'text' ) {
	$default = bsl_default( $name );
	$value   = bsl_field( $name, $default );
	switch ( $tag ) {
		case 'attr':
			echo esc_attr( $value );
			break;
		case 'url':
			echo esc_url( $value );
			break;
		default:
			echo esc_html( $value );
	}
}

/**
 * Caută valoarea implicită a unui câmp scalar în schemă, după nume.
 *
 * @param string $name Numele câmpului.
 * @return string
 */
function bsl_default( $name ) {
	static $map = null;
	if ( null === $map ) {
		$map = array();
		foreach ( bsl_content_schema() as $section ) {
			if ( ! empty( $section['fields'] ) ) {
				foreach ( $section['fields'] as $fname => $def ) {
					$map[ $fname ] = isset( $def['default'] ) ? $def['default'] : '';
				}
			}
		}
	}
	return isset( $map[ $name ] ) ? $map[ $name ] : '';
}

/**
 * Returnează rândurile default ale unei liste din schemă, după nume.
 *
 * @param string $name Numele repeater-ului.
 * @return array
 */
function bsl_list_default( $name ) {
	foreach ( bsl_content_schema() as $section ) {
		if ( ! empty( $section['lists'][ $name ]['default'] ) ) {
			return $section['lists'][ $name ]['default'];
		}
	}
	return array();
}
