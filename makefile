build/gz_2010_us_050_00_20m.zip:
	mkdir -p $(dir $@)
	curl -o $@ http://www2.census.gov/geo/tiger/GENZ2010/$(notdir $@)

build/gz_2010_us_050_00_20m.shp: build/gz_2010_us_050_00_20m.zip
	unzip -od $(dir $@) $<
	touch $@

build/counties.json: build/gz_2010_us_050_00_20m.shp ACS_12_5YR_B15003_with_ann.csv
	node_modules/.bin/topojson \
		-o $@ \
		--id-property='STATE+COUNTY,GEOid2' \
		--external-properties=ACS_12_5YR_B15003_with_ann.csv \
		--properties='name=GEOdisplaylabel' \
		--properties='graduatePercent=Math.floor((parseInt(d.properties["HD01_VD25"]) + parseInt(d.properties["HD01_VD24"]) + parseInt(d.properties["HD01_VD23"]))*1000/parseInt(d.properties["HD01_VD01"]))/10' \
		--properties='bachelorPercent=Math.floor((parseInt(d.properties["HD01_VD22"]))*1000/parseInt(d.properties["HD01_VD01"]))/10' \
    --properties='hsPercent=Math.floor((parseInt(d.properties["HD01_VD17"]) + parseInt(d.properties["HD01_VD18"]))*1000/parseInt(d.properties["HD01_VD01"]))/10' \
		--projection='width = 700, height = 425, d3.geo.albersUsa() \
			.scale(900) \
			.translate([width / 2, height / 2])' \
		--simplify=.5 \
		--filter=none \
		-- counties=$<

build/states.json: build/counties.json
	node_modules/.bin/topojson-merge \
		-o $@ \
		--in-object=counties \
		--out-object=states \
		--key='d.id.substring(0, 2)' \
		-- $<

us.json: build/states.json
	node_modules/.bin/topojson-merge \
		-o $@ \
		--in-object=states \
		--out-object=nation \
		-- $<
